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

module.exports = function StateProvider(renderer, rootElement, hashRouter) {
	var prototypalStateHolder = StateState()
	var current = CurrentState()
	var stateProviderEmitter = new EventEmitter()
	hashRouter = hashRouter || newHashBrownRouter()

	var destroyDom = Promise.denodeify(renderer.destroy)
	var getDomChild = Promise.denodeify(renderer.getChildElement)
	var renderDom = Promise.denodeify(renderer.render)

	var activeDomApis = {}
	var activeStateResolveContent = {}

	function handleError(e) {
		if (stateProviderEmitter.listeners('error') === 0) {
			console.error(e)
		}

		stateProviderEmitter.emit('error', e)
	}

	function destroyStateName(stateName) {
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

	current.set('', {})

	function onRouteChange(state, parameters) {
		stateProviderEmitter.go(state.name, parameters)
	}

	function addState(state) {
		prototypalStateHolder.add(state.name, state)

		var route = buildRoute(prototypalStateHolder, state.name)

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

	stateProviderEmitter.addState = addState
	stateProviderEmitter.go = function go(newStateName, parameters) {
		return guaranteeAllStatesExist(prototypalStateHolder, newStateName)
		.then(emit('stateChangeStart', newStateName, parameters))
		.then(function getStateChanges() {

			var stateComparisonResults = StateComparison(prototypalStateHolder)(current.get().name, current.get().parameters, newStateName, parameters)
			return stateChangeLogic(stateComparisonResults) // { destroy, change, create }
		}).then(function resolveDestroyAndActivateStates(stateChanges) {
			return resolveStates(getStatesToResolve(stateChanges), parameters).then(function destroyAndActivate(stateResolveResultsObject) {

				function activateAll() {
					var statesToActivate = stateChanges.change.concat(stateChanges.create)

					return activateStates(statesToActivate, stateResolveResultsObject)
				}

				extend(activeStateResolveContent, stateResolveResultsObject)

				return series(reverse(stateChanges.destroy), destroyStateName).then(function() {
					return renderAll(stateChanges.create).then(activateAll)
				})
			})

			function activateStates(stateNames) {
				return stateNames.map(prototypalStateHolder.get).forEach(function(state) {
					state.activate({
						domApi: activeDomApis[state.name],
						data: state.data,
						parameters: parameters,
						content: getContentObject(activeStateResolveContent, state.name)
					})
				})
			}
		}).then(function stateChangeComplete() {
			current.set(newStateName, parameters)
			stateProviderEmitter.emit('stateChangeEnd', newStateName, parameters)
		}).catch(handleError)
	}

	return stateProviderEmitter
}

function guaranteeAllStatesExist(prototypalStateHolder, newStateName) {
	return new Promise(function(resolve) {
		var stateNames = parse(newStateName)
		var statesThatDontExist = stateNames.filter(function(name) {
			return !prototypalStateHolder.get(name)
		})

		if (statesThatDontExist.length > 0) {
			throw new Error('State ' + statesThatDontExist[statesThatDontExist.length - 1] + ' does not exist')
		}

		resolve()
	})
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

function isFunction(property) {
	return function(obj) {
		return typeof obj[property] === 'function'
	}
}

function buildRoute(prototypalStateHolder, stateName) {
	return prototypalStateHolder.getHierarchy(stateName).reduce(function(route, state) {
		if (route && route[route.length - 1] !== '/' && state.route[0] !== '/') {
			route = route + '/'
		}
		return route + state.route
	}, '')
}

function reverse(ary) {
	return [].concat(ary)
}
