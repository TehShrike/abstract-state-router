var test = require('tape')
var assertingRendererFactory = require('./helpers/asserting-renderer-factory')
var getTestState = require('./helpers/test-state-factory')

test('Emitting errors when attempting to navigate to invalid states', function(t) {
	function testGoingTo(description, invalidStateName) {
		t.test(description, function(t) {
			var renderer = assertingRendererFactory(t, [])
			var state = getTestState(t, renderer)
			var stateRouter = state.stateRouter
			var assertsBelow = 1
			var renderAsserts = renderer.expectedAssertions

			t.plan(assertsBelow + renderAsserts)

			stateRouter.addState({
				name: 'valid',
				route: '/valid',
				activate: function(context) {
					t.fail('Should never activate the parent\'s state')
				}
			})

			stateRouter.addState({
				name: 'valid.valid',
				route: '/valid',
				activate: function(context) {
					t.fail('Should never activate the child\'s state')
				}
			})

			stateRouter.on('error', function(e) {
				t.notEqual(e.message.indexOf(invalidStateName), -1, 'invalid state name is in the error message')
				t.end()
			})

			stateRouter.go(invalidStateName, {})
		})
	}

	testGoingTo('All states invalid', 'invalid.also-invalid')
	testGoingTo('Only the child state invalid', 'valid.invalid')
})
