var test = require('tape')
var assertingRendererFactory = require('./helpers/asserting-renderer-factory')
var getTestState = require('./helpers/test-state-factory')

test('a normal replace call against the state router itself', function(t) {
	var parent1Template = {}
	var child1Template = {}
	var child2Template = {}
	var child3Template = {}
	var parentActivated = false
	var child1Activated = false
	var child2Activated = false
	var child3Activated = false

	var renderer = assertingRendererFactory(t, [
		parent1Template,
		child1Template,
		child2Template,
		child3Template
	])

	var state = getTestState(t, renderer)
	var stateRouter = state.stateRouter
	var assertsBelow = 4
	var renderAsserts = renderer.expectedAssertions

	t.plan(assertsBelow + renderAsserts)

	stateRouter.addState({
		name: 'valid',
		route: '/valid',
		template: parent1Template,
		resolve: function(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate: function(context) {
			t.notOk(parentActivated, 'parent activated once')
			parentActivated = true
		}
	})

	stateRouter.addState({
		name: 'valid.valid1',
		route: '/valid1',
		template: child1Template,
		resolve: function(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate: function(context) {
			t.notOk(child1Activated, 'child1 activated once')
			child1Activated = true
		}
	})

	stateRouter.addState({
		name: 'valid.valid2',
		route: '/valid2',
		template: child2Template,
		resolve: function(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate: function(context) {
			t.notOk(child2Activated, 'child2 activated once')
			child2Activated = true
		}
	})

	stateRouter.addState({
		name: 'valid.valid3',
		route: '/valid3',
		template: child3Template,
		resolve: function(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate: function(context) {
			t.notOk(child3Activated, 'child3 activated once')
			child3Activated = true

			t.end()
		}
	})

	stateRouter.go('valid.valid1')
	stateRouter.go('valid.valid2')
	stateRouter.go('valid.valid3')
})
