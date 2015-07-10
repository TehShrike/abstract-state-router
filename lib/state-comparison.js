var stateStringParser = require('./state-string-parser')
var combine = require('combine-arrays')
var pathToRegexp = require('path-to-regexp-with-reversible-keys')

module.exports = function StateComparison(stateState) {
	var getPathParameters = pathParameters()

	var parametersChanged = parametersThatMatterWereChanged.bind(null, stateState, getPathParameters)

	return stateComparison.bind(null, parametersChanged)
}

function pathParameters() {
	var parameters = {}

	return function getPathParameters(path) {
		if (!path) {
			return []
		}

		if (!parameters[path]) {
			parameters[path] = pathToRegexp(path).keys.map(function(key) {
				return key.name
			})
		}

		return parameters[path]
	}
}

function parametersThatMatterWereChanged(stateState, getPathParameters, stateName, fromParameters, toParameters) {
	var state = stateState.get(stateName)
	var querystringParameters = state.querystringParameters || []
	var parameters = getPathParameters(state.route).concat(querystringParameters)

	return Array.isArray(parameters) && parameters.some(function(key) {
		return fromParameters[key] !== toParameters[key]
	})
}

function stateComparison(parametersChanged, originalState, originalParameters, newState, newParameters) {
	var states = combine({
		start: stateStringParser(originalState),
		end: stateStringParser(newState)
	})

	return states.map(function(states) {
		return {
			nameBefore: states.start,
			nameAfter: states.end,
			stateNameChanged: states.start !== states.end,
			stateParametersChanged: states.start === states.end && parametersChanged(states.start, originalParameters, newParameters)
		}
	})
}
