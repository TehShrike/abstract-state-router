var StateState = require('./lib/state-state')
var StateComparison = require('./lib/state-comparison')
var CurrentState = require('./lib/current-state')
var stateChangeLogic = require('./lib/state-change-logic')
var parse = require('./lib/state-string-parser')
var StateTransitionManager = require('./lib/state-transition-manager')
var defaultRouterOptions = require('./default-router-options.js')

var series = require('./lib/promise-map-series')
var denodeify = require('then-denodeify')

var EventEmitter = require('events').EventEmitter
var extend = require('xtend')
var newHashBrownRouter = require('hash-brown-router')
var combine = require('combine-arrays')
var buildPath = require('page-path-builder')

require('native-promise-only/npo')

var expectedPropertiesOfAddState = ['name', 'route', 'defaultChild', 'data', 'template', 'resolve', 'activate', 'querystringParameters', 'defaultQuerystringParameters', 'defaultParameters']

module.exports = function StateProvider(makeRenderer, rootElement, stateRouterOptions) {
	var prototypalStateHolder = StateState()
	var lastCompletelyLoadedState = CurrentState()
	var lastStateStartedActivating = CurrentState()
	var stateProviderEmitter = new EventEmitter()
	StateTransitionManager(stateProviderEmitter)
	stateRouterOptions = extend({
		throwOnError: true,
		pathPrefix: '#'
	}, stateRouterOptions)

	if (!stateRouterOptions.router) {
		stateRouterOptions.router = newHashBrownRouter(defaultRouterOptions)
	}

	stateRouterOptions.router.on('not found', function(route, parameters) {
		stateProviderEmitter.emit('routeNotFound', route, parameters)
	})

	var destroyDom = null
	var getDomChild = null
	var renderDom = null
	var resetDom = null

	var activeDomApis = {}
	var activeStateResolveContent = {}
	var activeEmitters = {}

	function handleError(event, err) {
		process.nextTick(function() {
			stateProviderEmitter.emit(event, err)
			console.error(event + ' - ' + err.message)
			if (stateRouterOptions.throwOnError) {
				throw err
			}
		})
	}

	function destroyStateName(stateName) {
		var state = prototypalStateHolder.get(stateName)
		stateProviderEmitter.emit('beforeDestroyState', {
			state: state,
			domApi: activeDomApis[stateName]
		})

		activeEmitters[stateName].emit('destroy')
		activeEmitters[stateName].removeAllListeners()
		delete activeEmitters[stateName]
		delete activeStateResolveContent[stateName]

		return destroyDom(activeDomApis[stateName]).then(function() {
			delete activeDomApis[stateName]
			stateProviderEmitter.emit('afterDestroyState', {
				state: state
			})
		})
	}

	function resetStateName(parameters, stateName) {
		var domApi = activeDomApis[stateName]
		var content = getContentObject(activeStateResolveContent, stateName)
		var state = prototypalStateHolder.get(stateName)

		stateProviderEmitter.emit('beforeResetState', {
			domApi: domApi,
			content: content,
			state: state,
			parameters: parameters
		})

		activeEmitters[stateName].emit('destroy')
		delete activeEmitters[stateName]

		return resetDom({
			domApi: domApi,
			content: content,
			template: state.template,
			parameters: parameters
		}).then(function(newDomApi) {
			if (newDomApi) {
				activeDomApis[stateName] = newDomApi
			}

			stateProviderEmitter.emit('afterResetState', {
				domApi: activeDomApis[stateName],
				content: content,
				state: state,
				parameters: parameters
			})
		})
	}

	function getChildElementForStateName(stateName) {
		return new Promise(function(resolve) {
			var parent = prototypalStateHolder.getParent(stateName)
			if (parent) {
				var parentDomApi = activeDomApis[parent.name]
				resolve(getDomChild(parentDomApi))
			} else {
				resolve(rootElement)
			}
		})
	}

	function renderStateName(parameters, stateName) {
		return getChildElementForStateName(stateName).then(function(childElement) {
			var state = prototypalStateHolder.get(stateName)
			var content = getContentObject(activeStateResolveContent, stateName)

			stateProviderEmitter.emit('beforeCreateState', {
				state: state,
				content: content,
				parameters: parameters
			})

			return renderDom({
				element: childElement,
				template: state.template,
				content: content,
				parameters: parameters
			}).then(function(domApi) {
				activeDomApis[stateName] = domApi
				stateProviderEmitter.emit('afterCreateState', {
					state: state,
					domApi: domApi,
					content: content,
					parameters: parameters
				})
				return domApi
			})
		})
	}

	function renderAll(stateNames, parameters) {
		return series(stateNames, renderStateName.bind(null, parameters))
	}

	function onRouteChange(state, parameters) {
		try {
			var finalDestinationStateName = prototypalStateHolder.applyDefaultChildStates(state.name)

			if (finalDestinationStateName === state.name) {
				emitEventAndAttemptStateChange(finalDestinationStateName, parameters)
			} else {
				// There are default child states that need to be applied

				var theRouteWeNeedToEndUpAt = makePath(finalDestinationStateName, parameters)
				var currentRoute = stateRouterOptions.router.location.get()

				if (theRouteWeNeedToEndUpAt === currentRoute) {
					// the child state has the same route as the current one, just start navigating there
					emitEventAndAttemptStateChange(finalDestinationStateName, parameters)
				} else {
					// change the url to match the full default child state route
					stateProviderEmitter.go(finalDestinationStateName, parameters, { replace: true })
				}
			}
		} catch (err) {
			handleError('stateError', err)
		}
	}

	function addState(state) {
		if (typeof state === 'undefined') {
			throw new Error('Expected \'state\' to be passed in.')
		} else if (typeof state.name === 'undefined') {
			throw new Error('Expected the \'name\' option to be passed in.')
		} else if (typeof state.template === 'undefined') {
			throw new Error('Expected the \'template\' option to be passed in.')
		}
		Object.keys(state).filter(function(key) {
			return expectedPropertiesOfAddState.indexOf(key) === -1
		}).forEach(function(key) {
			console.warn('Unexpected property passed to addState:', key)
		})

		prototypalStateHolder.add(state.name, state)

		var route = prototypalStateHolder.buildFullStateRoute(state.name)

		stateRouterOptions.router.add(route, onRouteChange.bind(null, state))
	}

	function getStatesToResolve(stateChanges) {
		return stateChanges.change.concat(stateChanges.create).map(prototypalStateHolder.get)
	}

	function emitEventAndAttemptStateChange(newStateName, parameters) {
		stateProviderEmitter.emit('stateChangeAttempt', function stateGo(transition) {
			attemptStateChange(newStateName, parameters, transition)
		})
	}

	function attemptStateChange(newStateName, parameters, transition) {
		function ifNotCancelled(fn) {
			return function() {
				if (transition.cancelled) {
					var err = new Error('The transition to ' + newStateName + 'was cancelled')
					err.wasCancelledBySomeoneElse = true
					throw err
				} else {
					return fn.apply(null, arguments)
				}
			}
		}

		return promiseMe(prototypalStateHolder.guaranteeAllStatesExist, newStateName)
		.then(function applyDefaultParameters() {
			var state = prototypalStateHolder.get(newStateName)
			var defaultParams = state.defaultParameters || state.defaultQuerystringParameters || {}
			var needToApplyDefaults = Object.keys(defaultParams).some(function missingParameterValue(param) {
				return typeof parameters[param] === 'undefined'
			})

			if (needToApplyDefaults) {
				throw redirector(newStateName, extend(defaultParams, parameters))
			}
			return state
		}).then(ifNotCancelled(function(state) {
			stateProviderEmitter.emit('stateChangeStart', state, parameters)
			lastStateStartedActivating.set(state.name, parameters)
		})).then(function getStateChanges() {
			var stateComparisonResults = StateComparison(prototypalStateHolder)(lastCompletelyLoadedState.get().name, lastCompletelyLoadedState.get().parameters, newStateName, parameters)
			return stateChangeLogic(stateComparisonResults) // { destroy, change, create }
		}).then(ifNotCancelled(function resolveDestroyAndActivateStates(stateChanges) {
			return resolveStates(getStatesToResolve(stateChanges), extend(parameters)).catch(function onResolveError(e) {
				e.stateChangeError = true
				throw e
			}).then(ifNotCancelled(function destroyAndActivate(stateResolveResultsObject) {
				transition.cancellable = false

				function activateAll() {
					var statesToActivate = stateChanges.change.concat(stateChanges.create)

					return activateStates(statesToActivate)
				}

				activeStateResolveContent = extend(activeStateResolveContent, stateResolveResultsObject)

				return series(reverse(stateChanges.destroy), destroyStateName).then(function() {
					return series(reverse(stateChanges.change), resetStateName.bind(null, extend(parameters)))
				}).then(function() {
					return renderAll(stateChanges.create, extend(parameters)).then(activateAll)
				})
			}))

			function activateStates(stateNames) {
				return stateNames.map(prototypalStateHolder.get).forEach(function(state) {
					var emitter = new EventEmitter()
					var context = Object.create(emitter)
					context.domApi = activeDomApis[state.name]
					context.data = state.data
					context.parameters = parameters
					context.content = getContentObject(activeStateResolveContent, state.name)
					activeEmitters[state.name] = emitter

					try {
						state.activate && state.activate(context)
					} catch (e) {
						process.nextTick(function() {
							throw e
						})
					}
				})
			}
		})).then(function stateChangeComplete() {
			lastCompletelyLoadedState.set(newStateName, parameters)
			try {
				stateProviderEmitter.emit('stateChangeEnd', prototypalStateHolder.get(newStateName), parameters)
			} catch (e) {
				handleError('stateError', e)
			}
		}).catch(ifNotCancelled(function handleStateChangeError(err) {
			if (err && err.redirectTo) {
				stateProviderEmitter.emit('stateChangeCancelled', err)
				return stateProviderEmitter.go(err.redirectTo.name, err.redirectTo.params, { replace: true })
			} else if (err) {
				handleError('stateChangeError', err)
			}
		})).catch(function handleCancellation(err) {
			if (err && err.wasCancelledBySomeoneElse) {
				// we don't care, the state transition manager has already emitted the stateChangeCancelled for us
			} else {
				throw new Error("This probably shouldn't happen, maybe file an issue or something " + err)
			}
		})
	}

	function makePath(stateName, parameters, options) {
		function getGuaranteedPreviousState() {
			if (!lastStateStartedActivating.get().name) {
				throw new Error('makePath required a previous state to exist, and none was found')
			}
			return lastStateStartedActivating.get()
		}
		if (options && options.inherit) {
			parameters = extend(getGuaranteedPreviousState().parameters, parameters)
		}

		var destinationStateName = stateName === null ? getGuaranteedPreviousState().name : stateName

		var destinationState = prototypalStateHolder.get(destinationStateName) || {}
		var defaultParams = destinationState.defaultParameters || destinationState.defaultQuerystringParameters

		parameters = extend(defaultParams, parameters)

		prototypalStateHolder.guaranteeAllStatesExist(destinationStateName)
		var route = prototypalStateHolder.buildFullStateRoute(destinationStateName)
		return buildPath(route, parameters || {})
	}

	var defaultOptions = {
		replace: false
	}

	stateProviderEmitter.addState = addState
	stateProviderEmitter.go = function go(newStateName, parameters, options) {
		options = extend(defaultOptions, options)
		var goFunction = options.replace ? stateRouterOptions.router.replace : stateRouterOptions.router.go

		return promiseMe(makePath, newStateName, parameters, options).then(goFunction, handleError.bind(null, 'stateChangeError'))
	}
	stateProviderEmitter.evaluateCurrentRoute = function evaluateCurrentRoute(defaultState, defaultParams) {
		return promiseMe(makePath, defaultState, defaultParams).then(function(defaultPath) {
			stateRouterOptions.router.evaluateCurrent(defaultPath)
		}).catch(function(err) {
			handleError('stateError', err)
		})
	}
	stateProviderEmitter.makePath = function makePathAndPrependHash(stateName, parameters, options) {
		return stateRouterOptions.pathPrefix + makePath(stateName, parameters, options)
	}
	stateProviderEmitter.stateIsActive = function stateIsActive(stateName, opts) {
		var currentState = lastCompletelyLoadedState.get()
		return (currentState.name === stateName || currentState.name.indexOf(stateName + '.') === 0) && (typeof opts === 'undefined' || Object.keys(opts).every(function matches(key) {
			return opts[key] === currentState.parameters[key]
		}))
	}

	var renderer = makeRenderer(stateProviderEmitter)

	destroyDom = denodeify(renderer.destroy)
	getDomChild = denodeify(renderer.getChildElement)
	renderDom = denodeify(renderer.render)
	resetDom = denodeify(renderer.reset)

	return stateProviderEmitter
}

function getContentObject(stateResolveResultsObject, stateName) {
	var allPossibleResolvedStateNames = parse(stateName)

	return allPossibleResolvedStateNames.filter(function(stateName) {
		return stateResolveResultsObject[stateName]
	}).reduce(function(obj, stateName) {
		return extend(obj, stateResolveResultsObject[stateName])
	}, {})
}

function redirector(newStateName, parameters) {
	return {
		redirectTo: {
			name: newStateName,
			params: parameters
		}
	}
}

// { [stateName]: resolveResult }
function resolveStates(states, parameters) {
	var statesWithResolveFunctions = states.filter(isFunction('resolve'))
	var stateNamesWithResolveFunctions = statesWithResolveFunctions.map(property('name'))
	var resolves = Promise.all(statesWithResolveFunctions.map(function(state) {
		return new Promise(function (resolve, reject) {
			function resolveCb(err, content) {
				err ? reject(err) : resolve(content)
			}

			resolveCb.redirect = function redirect(newStateName, parameters) {
				reject(redirector(newStateName, parameters))
			}

			var res = state.resolve(state.data, parameters, resolveCb)
			if (res && (typeof res === 'object' || typeof res === 'function') && typeof res.then === 'function') {
				resolve(res)
			}
		})
	}))

	return resolves.then(function(resolveResults) {
		return combine({
			stateName: stateNamesWithResolveFunctions,
			resolveResult: resolveResults
		}).reduce(function(obj, result) {
			obj[result.stateName] = result.resolveResult
			return obj
		}, {})
	})
}

function property(name) {
	return function(obj) {
		return obj[name]
	}
}

function reverse(ary) {
	return ary.slice().reverse()
}

function isFunction(property) {
	return function(obj) {
		return typeof obj[property] === 'function'
	}
}

function promiseMe() {
	var fn = Array.prototype.shift.apply(arguments)
	var args = arguments
	return new Promise(function(resolve) {
		resolve(fn.apply(null, args))
	})
}
