var test = require('tape')
var assertingRendererFactory = require('./helpers/asserting-renderer-factory')
var getTestState = require('./helpers/test-state-factory')

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

test('normal, error-less state activation flow for two states', function(t) {
	var parentData = {}
	var child1Data = {}
	var child2Data = {}
	var parentTemplate = {}
	var child1Template = {}
	var child2Template = {}
	var parentResolveContent = {
		parentProperty: 'some string'
	}
	var child1ResolveContent = {
		child1Property: 'a different string'
	}
	var child2ResolveContent = {
		child2Property: 'whatever man'
	}


	var renderer = assertingRendererFactory(t, [parentTemplate, child1Template, child2Template])
	var state = getTestState(t, renderer)
	var stateRouter = state.stateRouter
	var assertsBelow = 11

	t.plan(assertsBelow + renderer.expectedAssertions)

	var parentResolveCalled = false
	var parentStateActivated = false
	var child1ResolveCalled = false
	var child1Activated = false

	stateRouter.addState({
		name: 'parent',
		route: '/parent',
		data: parentData,
		template: parentTemplate,
		resolve: function(data, parameters, cb) {
			t.notOk(parentResolveCalled, 'parent resolve function hasn\'t been called before')
			parentResolveCalled = true
			setTimeout(function() {
				cb(null, parentResolveContent)
			}, 50)
		},
		querystringParameters: ['wat'],
		activate: function(context) {
			t.notOk(parentStateActivated, 'parent state hasn\'t been activated before')
			parentStateActivated = true
		}
	})

	stateRouter.addState({
		name: 'parent.child1',
		route: '/child1',
		data: child1Data,
		template: child1Template,
		resolve: function(data, parameters, cb) {
			t.notOk(child1ResolveCalled, 'child1 resolve function hasn\'t been called before')
			child1ResolveCalled = true

			setTimeout(function() {
				cb(null, child1ResolveContent)
			}, 50)
		},
		activate: function(context) {
			t.notOk(child1Activated, 'child1 hasn\'t been activated before')

			setTimeout(function() {
				stateRouter.go('parent.child2', { wat: 'some value' })
			})
		}
	})

	stateRouter.addState({
		name: 'parent.child2',
		route: '/child2',
		data: child2Data,
		template: child2Template,
		resolve: function(data, parameters, cb) {
			t.equal(data, child2Data, 'got back the correct child2 data object in the child2 resolve function')
			t.equal(parameters.wat, 'some value', 'got the parent\'s querystring value in the child2 resolve function')

			setTimeout(function() {
				cb(null, child2ResolveContent)
			}, 50)
		},
		activate: function(context) {
			t.equal(context.domApi.template, child2Template, 'got back the correct DOM API')
			t.equal(context.data, child2Data, 'Got back the correct data object')
			t.equal(context.content.parentProperty, parentResolveContent.parentProperty, 'The child2 activate function got the parent property from the resolve function object')
			t.equal(context.content.child2Property, child2ResolveContent.child2Property, 'The child2 activate function got the child2 property from the resolve function')
			t.equal(context.parameters.wat, 'some value', 'got the the parent\'s parameter value in the child2\'s activate function')

			t.end()
		}
	})

	stateRouter.go('parent.child1', { wat: 'some value' })
})

test('makePath', function(t) {
	var stateRouter = getTestState(t).stateRouter

	t.plan(2)

	stateRouter.addState({
		name: 'parent',
		template: '',
		route: '/parent',
	})

	stateRouter.addState({
		name: 'parent.child1',
		template: '',
		route: '/child1',
	})

	stateRouter.addState({
		name: 'parent.child2',
		template: '',
		route: '/child2',
	})

	t.equal('#/parent/child1?param=value', stateRouter.makePath('parent.child1', { param: 'value' }))

	t.throws(function() {
		stateRouter.makePath('parent.doesnotexist')
	}, /doesnotexist/)

	t.end()
})

test('stateIsActive', function(t) {
	var stateRouter = getTestState(t).stateRouter

	t.plan(6)

	stateRouter.addState({
		name: 'parent',
		template: '',
		route: '/parent',
	})

	stateRouter.addState({
		name: 'parent.child1',
		template: '',
		route: '/child1'
	})

	stateRouter.addState({
		name: 'parent.child2',
		template: '',
		route: '/child2',
	})

	stateRouter.on('stateChangeEnd', function() {
		t.ok(stateRouter.stateIsActive('parent'), 'parent is active')
		t.ok(stateRouter.stateIsActive('parent.child1'), 'parent.child1 is active')
		t.notOk(stateRouter.stateIsActive('parent.child2'), 'parent.child2 is not active')
		t.notOk(stateRouter.stateIsActive('not a real state'), 'non-existant state is not active')

		t.notOk(stateRouter.stateIsActive('parent.child1', { butts: 'no' }), 'shouldn\'t match wuth butts=no')
		t.ok(stateRouter.stateIsActive('parent.child1', { butts: 'yes' }), 'should match with butts=yes')

		t.end()
	})

	stateRouter.go('parent.child1', { butts: 'yes' })
})

