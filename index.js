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



function inactiveStatesInHierarchy(state) {

}

module.exports = function StateProvider(hashRouter) {
	var stateHolder = StateState()

	function resolveState(name, content, cb) {
		var parentName = stateHolder.getParentName(name)
		if (parentName) {
			resolveState(stateHolder, parentName, content, function(parentContent) {
				stateHolder.get(name).resolve(function(newContent) {
					var inheritedContent = extend(Object.create(newContent), newContent)
					cb(inheritedContent)
				})
			})
		} else {
			stateHolder.get(name).resolve(cb)
		}
	}

	function onRouteChange(state, parameters) {

	}

	function addState(state) {
		state = Object.create(state)
		state.active = false
		stateHolder.add(state.name, state)

		hashRouter.add(state.route, onRouteChange.bind(null, state))
	}

	return {
		addState: addState
	}
}
