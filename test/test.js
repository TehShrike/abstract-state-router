/* Don't forget to test
- calling go with replace=true, and then having that state also call replace, or just error out the state transition

*/

var test = require('tape')
var hashRouterFactory = require('hash-brown-router')
var hashLocationMockFactory = require('hash-brown-router/hash-location-mock')
var stateRouterFactory = require('../')
var mockRenderFn = require('./support/renderer-mock')

function getTestState(t, renderFn) {
	var hashRouter = hashRouterFactory(hashLocationMockFactory())
	var stateRouter = stateRouterFactory(renderFn || mockRenderFn, 'body', hashRouter)
	hashRouter.setDefault(function noop() {})

	stateRouter.addState({
		name: 'dummy',
		route: '/dummy',
		data: {},
		render: t.fail.bind(t, 'dummy route was called')
	})

	return {
		hashRouter: hashRouter,
		stateRouter: stateRouter
	}
}

function assertingRenderFunctionFactory(t, expectedTemplates) {
	return function(element, template, emitter, cb) {
		t.ok(expectedTemplates.length, 'The render function hasn\'t been called too many times yet')
		var expected = expectedTemplates.shift()
		t.equal(expected, template, 'The expected template was sent to the render function')

		process.nextTick(function() {
			cb(null, 'dummy child element')
		})
	}
}

test('normal, error-less state activation flow for two states', function(t) {
	function basicTest(t) {
		var parentData = {}
		var childData = {}
		var parentTemplate = {}
		var childTemplate = {}
		var parentResolveContent = {
			parentProperty: 'some string'
		}
		var childResolveContent = {
			childProperty: 'a different string'
		}

		var state = getTestState(t, assertingRenderFunctionFactory(t, [parentTemplate, childTemplate]))
		var stateRouter = state.stateRouter
		var assertsBelow = 16
		var renderAsserts = 4

		t.plan(assertsBelow + renderAsserts)
		console.log('Plan for', assertsBelow + renderAsserts)

		var parentResolveFinished = false
		var parentStateActivated = false
		var childResolveFinished = false


		stateRouter.addState({
			name: 'rofl',
			route: '/routeButt',
			data: parentData,
			template: parentTemplate,
			resolve: function(data, parameters, cb) {
				t.equal(data, parentData, 'got back the correct parent data object in the activate function')
				t.equal(parameters.wat, 'wut', 'got the parameter value in the parent resolve function')
				setTimeout(function() {
					parentResolveFinished = true
					cb(null, parentResolveContent)
				}, 200)
			},
			querystringParameters: ['wat'],
			activate: function(data, parameters, content) {
				t.notOk(parentStateActivated, 'parent state hasn\'t been activated before')
				parentStateActivated = true

				t.ok(parentResolveFinished, 'Parent resolve was completed before the activate')

				t.equal(data, parentData, 'got back the correct data object in the activate function')
				t.equal(content.parentProperty, parentResolveContent.parentProperty, 'The parent activate function got the parent property from the resolve function object')
				t.notOk(content.childProperty, 'No child resolve content visible to the parent')
				t.equal(parameters.wat, 'wut', 'got the parameter value in the parent\'s activate function')
			}
		})

		stateRouter.addState({
			name: 'rofl.copter',
			route: '/lolcopter',
			data: childData,
			template: childTemplate,
			resolve: function(data, parameters, cb) {
				t.equal(data, childData, 'got back the correct child data object in the child resolve function')
				t.equal(parameters.wat, 'wut', 'got the parent\'s querystring value in the child resolve function')
				setTimeout(function() {
					childResolveFinished = true
					cb(null, childResolveContent)
				}, 100)
			},
			activate: function(data, parameters, content) {
				t.ok(parentStateActivated, 'Parent state was activated before the child state was')
				t.ok(childResolveFinished, 'Child resolve was completed before the activate')

				t.equal(data, childData, 'Got back the correct data object')
				t.equal(content.parentProperty, parentResolveContent.parentProperty, 'The child activate function got the parent property from the resolve function object')
				t.equal(content.childProperty, childResolveContent.childProperty, 'The child activate function got the child property from the resolve function')
				t.equal(parameters.wat, 'wut', 'got the the parent\'s parameter value in the child\'s activate function')

				t.end()
			}
		})

		return state
	}

	t.test('triggered with go()', function(t) {
		var stateRouter = basicTest(t).stateRouter
		stateRouter.go('rofl.copter', { wat: 'wut' })
	})

	t.test('triggered by the router', function(t) {
		var hashRouter = basicTest(t).hashRouter
		hashRouter.go('/routeButt/lolcopter?wat=wut')
	})
})


// test('calls resolve callback, passes results to the render callback', function(t) {
// 	var state = getTestState(t)

// 	t.plan(3)

// 	var resolveData = {}
// 	var originalData = {}

// 	function resolve(data, parameters, cb) {
// 		t.pass('resolve function called')
// 		t.equal(parameters.wat, 'wut', 'received the parameter from the url')
// 		process.nextTick(function() {
// 			cb(null, resolveData)
// 		})
// 	}

// 	function render(data, parameters, content) {
// 		t.equal(content, resolveData, 'received the object from the resolve function')
// 		t.end()
// 	}

// 	stateRouter.addState({
// 		name: 'someRoute',
// 		route: '/routeButt',
// 		data: originalData,
// 		querystringParameters: ['wat'],
// 		resolve: resolve,
// 		render: render
// 	})

// 	state.hashRouter.go('/routeButt?wat=wut')
// })

// test('activates both parent and child state', function(t) {
// 	var state = getTestState(t)

// 	t.plan(12)

// 	var parentData = {}
// 	var childData = {}

// 	var calledResolveFunctionForParent = false
// 	var calledResolveFunctionForChild = false

// 	var activatedParent = false
// 	var activatedChild = false

// 	state.stateRouter.addState({
// 		name: 'parent',
// 		route: '/routeParent',
// 		data: parentData,
// 		resolve: function(cb) {
// 			t.notOk(calledResolveFunctionForParent, 'Called the parent\'s resolve function for the first time')
// 			t.notOk(activatedParent, 'Called the resolve function before the render function')
// 			calledResolveFunctionForParent = true
// 		},
// 		render: function(data, parameters, content) {
// 			t.equal(data, parentData, 'got back the parent data object')
// 			t.notOk(parameters.wat, 'wut', 'got the right parameter')
// 			t.notOk(activatedParent, 'have not activated the parent before')
// 			t.notOk(activatedChild, 'have not activated the child yet')
// 			activatedParent = true
// 		}
// 	})

// 	state.stateRouter.addState({
// 		name: 'parent.child',
// 		route: '/routeChild',
// 		querystringParameters: ['wat'],
// 		data: childData,
// 		resolve: function(cb) {
// 			t.notOk(calledResolveFunctionForChild, 'Called the child\'s resolve function for the first time')
// 			t.notOk(activatedChild, 'Called the resolve function before the render function')
// 			calledResolveFunctionForChild = true
// 		},
// 		render: function(data, parameters, content) {
// 			t.equal(data, childData, 'got back the child data object')
// 			t.equal(parameters.wat, 'wut', 'got the right parameter')
// 			t.ok(activatedParent, 'have already activated the parent')
// 			t.notOk(activatedChild, 'have not activated the child before')
// 			activatedChild = true
// 			t.end()
// 		}
// 	})

// 	state.hashRouter.go('/routeParent/routeChild?wat=wut')
// })
