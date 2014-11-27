var page = require('page')
var StateState = require('./state-state')
var extend = require('extend')
var Promise = require('promise')
var StateComparison = require('./state-comparison')
var CurrentState = require('./current-state')
var stateChangeLogic = require('./state-change-logic')

function resolveSingleState(state, parameters) {
	return new Promise(function(resolve, reject) {

		function callback(err, content) {
			if (err) {
				reject(err)
			} else {
				resolve(content)
			}
		}

		function redirectCallback(stateName, params) {
			reject(new Error('redirect callbacks not implemented yet'))
		}

		if (typeof state.resolve === 'function') {
			state.resolve(state.data, parameters, callback, redirectCallback)
		}
	})
}

function resolveParentsAndEverything(stateHolder, stateName, parameters) {
	var parent = stateHolder.getParentName(stateName)

	var parentsResolved = parent ? resolveParentsAndEverything(stateHolder, parent, parameters) : Promise.resolve({})

	return parentsResolved.then(function(resolvedData) {
		return Object.create(resolvedData)
	}).then(function(resolvedData) {
		return new Promise(function(resolve, reject) {
			var state = stateHolder.get(stateName)
			if (state.resolve) {
				return state.resolve(parameters, function(err, whateverData) {
					if (err) {
						reject(err)
					} else {
						resolve(extend(resolvedData, whateverData))
					}
				})
			} else {
				return resolve(resolvedData)
			}
		})
	})
}

function resolveAll(stateHolder, stateNames, parameters) {
	var allResolvePromises = stateNames.map(function(stateName) {
		return new Promise(function(resolve, reject) {
			var providedResolveFn = stateHolder.get(stateName).resolve
			if (typeof providedResolveFn === 'function') {
				providedResolveFn(parameters, function(err, data) {
					if (err) {
						reject(err)
					} else {
						resolve(data)
					}
				})
			} else {
				resolve({})
			}
		})
	})

	return Promise.all(allResolvePromises).then(function(allResolvedValues) {
		allResolvedValues.unshift({})
		return extend.apply.apply(null, allResolvedValues)
	})
}

function onRouteChange(stateHolder, currentState, stateComparison, activeStates, state, parameters) {
	// originalState, originalParameters, newState, newParameters
	var stateComparisonResults = stateComparison(currentState.get().name, currentState.get().parameters, state.name, parameters)
	var stateChangeActions = stateChangeLogic(stateComparisonResults)

	// { destroy, change, create }

	stateChangeActions.destroy.forEach(function(stateName) {
		activeStates[stateName].emitter.emit('destroy')
	})

	var stateNamesToInstantiate = stateChangeActions.change.concat(stateChangeActions.create)

	resolveAll(stateNamesToInstantiate).then(function(resolvedValue) {
		stateChangeActions.change.map(function(stateName) {
			activeStates[stateName].emitter.emit('change', parameters, resolvedValue)
		})
	})

}

module.exports = function StateProvider(hashRouter, render) {
	var stateHolder = StateState()
	var current = CurrentState()

	var activeDomElementsAndEmitters = {}

	// function onRouteChange(state, parameters) {

	// 	resolveParentsAndEverything(stateHolder, state.name, parameters).then(function(resolvedData) {

	// 	})
	// }

	function addState(state) {
		state = Object.create(state)
		state.active = false
		stateHolder.add(state.name, state)

		hashRouter.add(state.route, onRouteChange.bind(null, stateHolder, current, stateComparison, activeDomElementsAndEmitters, state))
	}

	return {
		addState: addState
	}
}
