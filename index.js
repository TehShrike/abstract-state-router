var StateState = require('./state-state')
var extend = require('extend')
var Promise = require('promise')
var StateComparison = require('./state-comparison')
var CurrentState = require('./current-state')
var stateChangeLogic = require('./state-change-logic')
var newHashBrownRouter = require('hash-brown-router')

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

function handleStateChange(stateHolder, stateChangeActions, activeStates, parameters) {
	stateChangeActions.destroy.forEach(function(stateName) {
		activeStates[stateName].emitter.emit('destroy')
	})

	var stateNamesToInstantiate = stateChangeActions.change.concat(stateChangeActions.create)

	return resolveAll(stateHolder, stateNamesToInstantiate, parameters).then(function(resolvedValue) {
		stateChangeActions.change.forEach(function(stateName) {
			activeStates[stateName].emitter.emit('change', parameters, resolvedValue)
		})

		// TODO
		createAll(stateChangeActions.create)

		var instantiationPromises = stateNamesToInstantiate.map(function(stateName) {
			return new Promise(function(resolve, reject) {
				var state = stateHolder.get(stateName)
				resolve(state.activate(state.data, parameters, resolvedValue))
			})
		})

		return Promise.all(instantiationPromises)
	})
}

function onRouteChange(stateHolder, currentState, stateComparison, activeStates, state, parameters) {
	// originalState, originalParameters, newState, newParameters
	var stateComparisonResults = stateComparison(currentState.get().name, currentState.get().parameters, state.name, parameters)
	var stateChangeActions = stateChangeLogic(stateComparisonResults)

	// { destroy, change, create }

	return handleStateChange(stateHolder, stateChangeActions, activeStates, parameters)

}

module.exports = function StateProvider(render, hashRouter) {
	var stateHolder = StateState()
	var current = CurrentState()
	var stateComparison = StateComparison(stateHolder)
	hashRouter = hashRouter || newHashBrownRouter()

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
