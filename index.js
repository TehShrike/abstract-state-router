var page = require('page')
var parseStateString = require('./state-string-parser.js')
var makeTree = require('make-tree')
var extend = require('extend')

var states = {}

function curry(fn, arg1) {
	return fn.bind(null, arg1)
}

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

module.exports = function StateProvider(hashRouter) {

	// var hierarchy = parseStateString(identifier)
	// var newState = makeTree(hierarchy, states)
	// page(state.url, curry(resolve, state), curry(displayState, state))

	function getRoute(stateName, route) {
		// TODO: parent state routes or whatever
		return route
	}

	function addState(stateName, route, data, resolveFunction, callback) {
		var routePath = getRoute(stateName, route)
		hashRouter.add(routePath, function(parameters) {
			var content = null // TODO: get from the resolve function

			callback(data, parameters, content)
		})
	}

	return {
		addState: addState
	}
}
