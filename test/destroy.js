var test = require('tape')
var assertingRendererFactory = require('./helpers/asserting-renderer-factory')
var getTestState = require('./helpers/test-state-factory')

test('moving from x.y.z to x destroys z then y', function(t) {
	function basicTest(t) {
		var grandparentTemplate = {}
		var parentTemplate = {}
		var childTemplate = {}

		var renderer = assertingRendererFactory(t, [grandparentTemplate, parentTemplate, childTemplate])
		var state = getTestState(t, renderer)
		var stateRouter = state.stateRouter
		var assertsBelow = 4
		var renderAsserts = renderer.expectedAssertions

		t.plan(assertsBelow + renderAsserts)

		var childDestroyed = false
		var parentDestroyed = false
		var grandparentDestroyed = false

		stateRouter.addState({
			name: 'hey',
			route: '/hay',
			template: grandparentTemplate,
			resolve: function(data, parameters, cb) {
				setTimeout(cb, 0, null)
			},
			activate: function(context) {
				context.on('destroy', function () {
					grandparentDestroyed = true
					t.ok(parentDestroyed, 'grandparent gets destroyed after parent')
					t.ok(childDestroyed, 'grandparent gets destroyed after child')

					t.fail('grandparent should not be destroyed')
				})
			}
		})

		stateRouter.addState({
			name: 'hey.rofl',
			route: '/routeButt',
			template: parentTemplate,
			resolve: function(data, parameters, cb) {
				setTimeout(cb, 10, null)
			},
			querystringParameters: ['wat'],
			activate: function(context) {
				context.on('destroy', function () {
					t.notOk(grandparentDestroyed, 'parent gets destroyed before grandparent')
					parentDestroyed = true
					t.ok(childDestroyed, 'parent gets destroyed after child')
				})
			}
		})

		stateRouter.addState({
			name: 'hey.rofl.copter',
			route: '/lolcopter',
			template: childTemplate,
			resolve: function(data, parameters, cb) {
				setTimeout(cb, 0, null)
			},
			activate: function(context) {
				context.on('destroy', function () {
					t.notOk(grandparentDestroyed, 'child gets destroyed before grandparent')
					t.notOk(parentDestroyed, 'child gets destroyed before parent')
					childDestroyed = true
				})
			}
		})

		return state
	}

	t.test('triggered with go()', function(t) {
		var stateRouter = basicTest(t).stateRouter
		stateRouter.go('hey.rofl.copter', { wat: 'wut' })
		stateRouter.once('stateChangeEnd', function() {
			stateRouter.go('hey')
			stateRouter.once('stateChangeEnd', function() {
				t.end()
			})
		})
	})

	t.test('triggered by the router', function(t) {
		var testState = basicTest(t)
		var hashRouter = testState.hashRouter
		hashRouter.go('/hay/routeButt/lolcopter?wat=wut')
		testState.stateRouter.once('stateChangeEnd', function() {
			hashRouter.go('/hay')
			testState.stateRouter.once('stateChangeEnd', function() {
				t.end()
			})
		})
	})
})

test('a state with changing querystring gets destroyed', function(t) {
	var state = getTestState(t)
	var stateRouter = state.stateRouter
	var parentResolveCalled = 0
	var parentActivated = 0
	var parentDestroyed = 0
	var child1Destroyed = 0

	t.plan(5)

	stateRouter.addState({
		name: 'parent',
		route: '/parent',
		querystringParameters: ['aParam'],
		resolve: function(data, parameters, cb) {
			parentResolveCalled++
			if (parentResolveCalled === 2) {
				t.equal(parameters.aParam, '3', 'parameter was set correctly in second resolve')
			}

			cb(null, {})
		},
		activate: function(context) {
			parentActivated++
			context.on('destroy', function() {
				parentDestroyed++
			})
		}
	})

	stateRouter.addState({
		name: 'parent.child1',
		route: '/child1',
		activate: function(context) {
			context.on('destroy', function() {
				child1Destroyed++
			})

			stateRouter.go('parent.child2', {
				aParam: '3'
			})
		}
	})

	stateRouter.addState({
		name: 'parent.child2',
		route: '/child2',
		activate: function(context) {
			t.equal(parentResolveCalled, 2, 'parent resolve called twice')
			t.equal(parentActivated, 2, 'parent activated twice')
			t.equal(child1Destroyed, 1, 'child1 destroyed once')
			t.equal(parentDestroyed, 1, 'parent destroyed once')
			t.end()
		}
	})

	stateRouter.go('parent.child1')
})
