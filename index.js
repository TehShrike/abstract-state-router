var page = require('page')
var StateState = require('./state-state')
var extend = require('extend')

function resolve(state, context, next) {
	var params = extend(true, {}, context.params, context.query)

	if (state.resolve) {
		state.resolve(params, function exposedNext(data) {
			context.resolved = data
			next()
		})
	}
}

function displayState(state, context) {
	state.display(context.resolved)
}

function getFromStates(stateTree, stateIdentifierArray, property) {
	var current = stateTree
	return stateIdentifierArray.map(function(identifier) {
		var child = current[identifier]

		return child[property]
	})
}

function resolveState(allStates, name, content, cb) {
	var parentName = allStates.getParentName(name)
	if (parentName) {
		resolveState(allStates, parentName, content, function(parentContent) {
			allStates.get(name).resolve(function(newContent) {
				var inheritedContent = extend(Object.create(newContent), newContent)
				cb(inheritedContent)
			})
		})
	} else {
		allStates.get(name).resolve(cb)
	}
}

module.exports = function StateProvider(hashRouter) {
	var states = StateState()

	function addState(stateName, route, data, resolveFunction, renderFunction) {
		states.add(stateName, {
			route: route,
			data: data,
			resolve: resolveFunction,
			render: renderFunction
		})

		hashRouter.add(routePath, function(parameters) {
			resolveState(states, stateName, {}, function(content) {
				callback(data, parameters, content)
			})
		})
	}

	return {
		addState: addState
	}
}
