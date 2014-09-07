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

module.exports = function addState(identifier, state) {
	var hierarchy = parseStateString(identifier)
	var newState = makeTree(hierarchy, states)
	page(state.url, curry(resolve, state), curry(displayState, state))
}
