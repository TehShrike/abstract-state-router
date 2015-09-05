var test = require('tape-catch')
var assertingRendererFactory = require('./helpers/asserting-renderer-factory')
var getTestState = require('./helpers/test-state-factory')

test('a normal replace call against the state router itself', function(t) {
	var parent1Template = {}
	var child1Template = {}
	var child2Template = {}
	var renderer = assertingRendererFactory(t, [ parent1Template, child1Template, child2Template ])
	var state = getTestState(t, renderer)
	var stateRouter = state.stateRouter
	var assertsBelow = 4
	var renderAsserts = renderer.expectedAssertions

	t.plan(assertsBelow + renderAsserts)

	var parentActivated = false
	var child1Activated = false
	var child2Activated = false

	stateRouter.addState({
		name: 'valid1',
		route: '/valid1',
		template: parent1Template,
		activate: function(context) {
			t.notOk(parentActivated, 'parent activated once')
			parentActivated = true
		}
	})

	stateRouter.addState({
		name: 'valid1.valid',
		route: '/valid1',
		template: child1Template,
		activate: function(context) {
			t.notOk(child1Activated, 'child1 activated once')
			child1Activated = true

			setTimeout(function() {
				stateRouter.go('valid1.valid2', {}, { replace: true })
			}, 10)
		}
	})

	stateRouter.addState({
		name: 'valid1.valid2',
		route: '/valid2',
		template: child2Template,
		activate: function(context) {
			t.notOk(child2Activated, 'child2 activated once')
			child2Activated = true

			t.equal(state.location.get(), '/valid1/valid2')

			t.end()
		}
	})

	stateRouter.go('valid1.valid')
})
