var stateStringParser = require('./state-string-parser')
var combine = require('combine-arrays')

module.exports = function StateComparison(stateState) {
	var parametersChanged = parametersThatMatterWereChanged.bind(null, stateState)

	return stateComparison.bind(null, parametersChanged)
}

function parametersThatMatterWereChanged(stateState, stateName, fromParameters, toParameters) {
	var parameters = stateState.get(stateName).querystringParameters

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
