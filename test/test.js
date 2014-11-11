/* Don't forget to test
- calling go with replace=true, and then having that state also call replace, or just error out the state transition

*/

var test = require('tape')
var pathtoRegexp = require('path-to-regexp')
var hashRouterFactory = require('hash-brown-router')
var hashLocationMockFactory = require('hash-brown-router/hash-location-mock')
var stateRouterFactory = require('../')

function getTestState(t) {
	var hashRouter = hashRouterFactory(hashLocationMockFactory())
	var stateRouter = stateRouterFactory(hashRouter)
	stateRouter.setDefault(t.fail.bind(fail, 'default route was called'))

	stateRouter.addState('dummy', '/dummy', {}, null, t.fail.bind(fail, 'dummy route was called'))

	return {
		hashRouter: hashRouter,
		stateRouter: stateRouter
	}
}

test('activates a state, passes in a parameter from the querystring', function(t) {
	var state = getTestState(t)
	var originalData = {}

	t.plan(2)

	stateRouter.addState('butts', '/routeButt', originalData, null, function(data, parameters, content) {
		t.equal(data, originalData, 'got back the same data object')
		t.equal(parameters.wat, 'wut', 'got the right parameter')
		t.end()
	})

	state.hashRouter.go('/routeButt?wat=wut')
})

test('calls resolve callback, passes results to the render callback', function(t) {
	var state = getTestState(t)

	t.plan(3)

	var resolveData = {}
	var originalData = {}

	function resolve(data, parameters, cb) {
		t.pass('resolve function called')
		t.equal(parameters.wat, 'wut', 'received the parameter from the url')
		process.nextTick(function() {
			cb(null, resolveData)
		})
	}

	function render(data, parameters, content) {
		t.equal(content, resolveData, 'received the object from the resolve function')
		t.end()
	}

	stateRouter.addState('someRoute', '/routeButt', originalData, resolve, render)

	state.hashRouter.go('/routeButt?wat=wut')
})

test('activates both parent and child state', function(t) {
	var state = getTestState(t)

	t.plan(8)

	var parentData = {}
	var childData = {}

	var activatedParent = false
	var activatedChild = false

	state.stateRouter.addState('parent', '/routeParent', parentData, null, function(data, parameters, content) {
		t.equal(data, parentData, 'got back the parent data object')
		t.equal(parameters.wat, 'wut', 'got the right parameter')
		t.notOk(activatedParent, 'have not activated the parent before')
		t.notOk(activatedChild, 'have not activated the child yet')
		activatedParent = true
	})

	state.stateRouter.addState('parent.child', '/routeChild', childData, null, function(data, parameters, content) {
		t.equal(data, childData, 'got back the child data object')
		t.equal(parameters.wat, 'wut', 'got the right parameter')
		t.ok(activatedParent, 'have already activated the parent')
		t.notOk(activatedChild, 'have not activated the child before')
		activatedChild = true
		t.end()
	})

	state.hashRouter.go('/routeParent/routeChild?wat=wut')
})
