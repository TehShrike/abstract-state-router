var StateState = require('./state-state')
var extend = require('extend')
var Promise = require('promise')
var StateComparison = require('./state-comparison')
var CurrentState = require('./current-state')
var stateChangeLogic = require('./state-change-logic')
var newHashBrownRouter = require('hash-brown-router')
var EventEmitter = require('events').EventEmitter
var series = require('promise-map-series')
var parse = require('./state-string-parser')
var combine = require('combine-arrays')
var buildPath = require('page-path-builder')
var StateTransitionManager = require('./state-transition-manager')

module.exports = function StateProvider(renderer, rootElement, hashRouter) {
	var prototypalStateHolder = StateState()
	var current = CurrentState()
	var stateProviderEmitter = new EventEmitter()
	StateTransitionManager(stateProviderEmitter)
	hashRouter = hashRouter || newHashBrownRouter()
	current.set('', {})

	var destroyDom = Promise.denodeify(renderer.destroy)
	var getDomChild = Promise.denodeify(renderer.getChildElement)
	var renderDom = Promise.denodeify(renderer.render)
	var resetDom = Promise.denodeify(renderer.reset)

	var activeDomApis = {}
	var activeStateResolveContent = {}
	var activeEmitters = {}

	function handleError(event, err) {
		if (!stateProviderEmitter.emit(event, err)) {
			console.error(err)
		}
	}

	function destroyStateName(stateName) {
		activeEmitters[stateName]('destroy')
		delete activeEmitters[stateName]
		delete activeStateResolveContent[stateName]
		return destroyDom(activeDomApis[stateName]).then(function() {
			delete activeDomApis[stateName]
		})
	}

	function resetStateName(stateName) {
		activeEmitters[stateName]('destroy')
		delete activeEmitters[stateName]
		delete activeStateResolveContent[stateName]
		return resetDom(activeDomApis[stateName])
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

	function renderStateName(stateName) {
		var state = prototypalStateHolder.get(stateName)

		return getChildElementForStateName(stateName).then(function(childElement) {
			return renderDom(childElement, state.template)
		}).then(function(domApi) {
			activeDomApis[stateName] = domApi
			return domApi
		})
	}

	function renderAll(stateNames) {
		return series(stateNames, renderStateName)
	}

	function onRouteChange(state, parameters) {
		function stateGo(transition) {
			var fullStateName = prototypalStateHolder.applyDefaultChildStates(state.name)
			attemptStateChange(fullStateName, parameters, transition)
		}

		stateProviderEmitter.emit('stateChangeAttempt', stateGo)
	}

	function addState(state) {
		prototypalStateHolder.add(state.name, state)

		var route = prototypalStateHolder.buildFullStateRoute(state.name)

		hashRouter.add(route, onRouteChange.bind(null, state))
	}

	function emit() {
		var args = Array.prototype.slice.apply(arguments)
		return function() {
			return stateProviderEmitter.emit.apply(stateProviderEmitter, args)
		}
	}

	function getStatesToResolve(stateChanges) {
		return stateChanges.change.concat(stateChanges.create).map(prototypalStateHolder.get)
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

		return prototypalStateHolder.guaranteeAllStatesExist(newStateName)
		.then(function applyDefaultParameters() {
			var state = prototypalStateHolder.get(newStateName)
			var defaultParams = state.defaultQuerystringParameters || {}
			var needToApplyDefaults = Object.keys(defaultParams).some(function missingParameterValue(param) {
				return !parameters[param]
			})

			if (needToApplyDefaults) {
				throw redirector(newStateName, extend({}, defaultParams, parameters))
			}

		}).then(ifNotCancelled(emit('stateChangeStart', newStateName, parameters)))
		.then(function getStateChanges() {

			var stateComparisonResults = StateComparison(prototypalStateHolder)(current.get().name, current.get().parameters, newStateName, parameters)
			return stateChangeLogic(stateComparisonResults) // { destroy, change, create }
		}).then(ifNotCancelled(function resolveDestroyAndActivateStates(stateChanges) {
			return resolveStates(getStatesToResolve(stateChanges), parameters).catch(function onResolveError(e) {
				e.stateChangeError = true
				throw e
			}).then(ifNotCancelled(function destroyAndActivate(stateResolveResultsObject) {
				transition.cancellable = false

				function activateAll() {
					var statesToActivate = stateChanges.change.concat(stateChanges.create)

					return activateStates(statesToActivate)
				}

				extend(activeStateResolveContent, stateResolveResultsObject)

				return series(reverse(stateChanges.destroy), destroyStateName).then(function() {
					return series(reverse(stateChanges.change), resetStateName)
				}).then(function() {
					return renderAll(stateChanges.create).then(activateAll)
				})
			}))

			function activateStates(stateNames) {
				return stateNames.map(prototypalStateHolder.get).forEach(function(state) {
					var context = new EventEmitter()
					extend(context, {
						domApi: activeDomApis[state.name],
						data: state.data,
						parameters: parameters,
						content: getContentObject(activeStateResolveContent, state.name)
					})
					activeEmitters[state.name] = function emit() {
						context.emit.apply(context, arguments)
					}

					try {
						state.activate(context)
					} catch (e) {
						console.error(e)
					}
				})
			}
		})).then(function stateChangeComplete() {
			current.set(newStateName, parameters)
			try {
				stateProviderEmitter.emit('stateChangeEnd', newStateName, parameters)
			} catch (e) {
				handleError('error', e)
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

	function getDestinationUrl(stateName, parameters) {
		return new Promise(function(resolve, reject) {
			resolve(prototypalStateHolder.guaranteeAllStatesExist(stateName).then(function() {
				var route = prototypalStateHolder.buildFullStateRoute(stateName)
				return buildPath(route, parameters || {})
			}))
		})
	}

	var defaultOptions = {
		replace: false
	}

	stateProviderEmitter.addState = addState
	stateProviderEmitter.go = function go(newStateName, parameters, options) {
		options = extend({}, defaultOptions, options)
		var goFunction = options.replace ? hashRouter.replace : hashRouter.go

		return getDestinationUrl(newStateName, parameters).then(goFunction, handleError.bind(null, 'stateChangeError'))
	}

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
			state.resolve(state.data, parameters, resolveCb, redirect)

			function resolveCb(err, content) {
				err ? reject(err) : resolve(content)
			}

			function redirect(newStateName, parameters) {
				reject( redirector(newStateName, parameters) )
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
