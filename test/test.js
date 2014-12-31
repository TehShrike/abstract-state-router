var test = require('tape')
var assertingRendererFactory = require('./support/asserting-renderer-factory')
var getTestState = require('./support/test-state-factory')

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

		var renderer = assertingRendererFactory(t, [parentTemplate, childTemplate])
		var state = getTestState(t, renderer)
		var stateRouter = state.stateRouter
		var assertsBelow = 18
		var renderAsserts = renderer.expectedAssertions

		t.plan(assertsBelow + renderAsserts)

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
			activate: function(context) {
				var domApi = context.domApi
				var data = context.data
				var parameters = context.parameters
				var content = context.content

				t.notOk(parentStateActivated, 'parent state hasn\'t been activated before')
				parentStateActivated = true

				t.ok(parentResolveFinished, 'Parent resolve was completed before the activate')

				t.equal(domApi.template, parentTemplate, 'got back the correct DOM API')
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
			activate: function(context) {
				var domApi = context.domApi
				var data = context.data
				var parameters = context.parameters
				var content = context.content

				t.ok(parentStateActivated, 'Parent state was activated before the child state was')
				t.ok(childResolveFinished, 'Child resolve was completed before the activate')

				t.equal(domApi.template, childTemplate, 'got back the correct DOM API')
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


test('undefined data, querystring, and resolve function', function(t) {
	function basicTest(t) {
		var parentTemplate = {}

		var renderer = assertingRendererFactory(t, [parentTemplate])
		var state = getTestState(t, renderer)
		var assertsBelow = 3

		t.plan(assertsBelow + renderer.expectedAssertions)

		state.stateRouter.addState({
			name: 'rofl',
			route: '/routeButt',
			template: parentTemplate,
			activate: function(context) {
				var data = context.data
				var parameters = context.parameters
				var content = context.content

				t.equal(typeof data, 'undefined', 'data is undefined')
				t.equal(parameters.wat, 'wut', 'got the parameter value')
				t.equal(Object.keys(content).length, 0, 'No keys on the content object')
				t.end()
			}
		})

		return state
	}

	t.test('triggered with go()', function(t) {
		var stateRouter = basicTest(t).stateRouter
		stateRouter.go('rofl', { wat: 'wut' })
	})

	t.test('triggered by the router', function(t) {
		var hashRouter = basicTest(t).hashRouter
		hashRouter.go('/routeButt?wat=wut')
	})
})
