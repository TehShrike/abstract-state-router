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
var StateTransitionWatcher = require('./state-transition-watcher')
var QueueStateChangeEnd = require('./queue-state-change-end')

module.exports = function StateProvider(renderer, rootElement, hashRouter) {
	var prototypalStateHolder = StateState()
	var current = CurrentState()
	var stateProviderEmitter = new EventEmitter()
	var isTransitioning = StateTransitionWatcher(stateProviderEmitter)
	var queueUpStateGo = QueueStateChangeEnd(stateProviderEmitter)
	hashRouter = hashRouter || newHashBrownRouter()
	current.set('', {})

	var destroyDom = Promise.denodeify(renderer.destroy)
	var getDomChild = Promise.denodeify(renderer.getChildElement)
	var renderDom = Promise.denodeify(renderer.render)
	var resetDom = Promise.denodeify(renderer.reset)

	var activeDomApis = {}
	var activeStateResolveContent = {}
	var activeEmitters = {}

	function handleError(e) {
		stateProviderEmitter.emit('error', e)

		if (stateProviderEmitter.listeners('error') === 0) {
			console.error(e)
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
		function stateGo() {
			var fullStateName = prototypalStateHolder.applyDefaultChildStates(state.name)
			attemptStateChange(fullStateName, parameters)
		}

		if (isTransitioning()) {
			queueUpStateGo(stateGo)
		} else {
			stateProviderEmitter.emit('stateChangeAttempt')
			stateGo()
		}
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

	function attemptStateChange(newStateName, parameters) {
		return prototypalStateHolder.guaranteeAllStatesExist(newStateName)
		.then(function applyDefaultParameters() {
			var state = prototypalStateHolder.get(newStateName)
			var defaultParams = state.defaultQuerystringParameters || {}
			var needToApplyDefaults = Object.keys(defaultParams).some(function missingParameterValue(param) {
				return !parameters[param]
			})

			if (needToApplyDefaults) {
				throw {
					redirectTo: {
						name: newStateName,
						params: extend({}, defaultParams, parameters)
					}
				}
			}

		}).then(emit('stateChangeStart', newStateName, parameters))
		.then(function getStateChanges() {

			var stateComparisonResults = StateComparison(prototypalStateHolder)(current.get().name, current.get().parameters, newStateName, parameters)
			return stateChangeLogic(stateComparisonResults) // { destroy, change, create }
		}).then(function resolveDestroyAndActivateStates(stateChanges) {
			return resolveStates(getStatesToResolve(stateChanges), parameters).catch(function onResolveError(e) {
				stateProviderEmitter.emit('stateChangeError', e)
				throw e
			}).then(function destroyAndActivate(stateResolveResultsObject) {

				function activateAll() {
					var statesToActivate = stateChanges.change.concat(stateChanges.create)

					return activateStates(statesToActivate)
				}

				extend(activeStateResolveContent, stateResolveResultsObject)

				return series(reverse(stateChanges.destroy), destroyStateName).then(function() {
					return renderAll(stateChanges.create).then(activateAll)
				})
			})

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
		}).then(function stateChangeComplete() {
			current.set(newStateName, parameters)
			stateProviderEmitter.emit('stateChangeEnd', newStateName, parameters)
		}).catch(function(err) {
			if (err && err.redirectTo) {
				stateProviderEmitter.emit('stateChangeCancelled')
				stateProviderEmitter.go(err.redirectTo.name, err.redirectTo.params, { replace: true })
			} else {
				throw err
			}
		}).catch(handleError)
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

		return getDestinationUrl(newStateName, parameters).then(goFunction, handleError)
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

// { [stateName]: resolveResult }
function resolveStates(states, parameters) {
	var statesWithResolveFunctions = states.filter(isFunction('resolve'))
	var stateNamesWithResolveFunctions = statesWithResolveFunctions.map(property('name'))
	var resolves = Promise.all(statesWithResolveFunctions.map(function(state) {
		return Promise.denodeify(state.resolve)(state.data, parameters)
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
