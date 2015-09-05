var test = require('tape-catch')
var getTestState = require('./helpers/test-state-factory')

test('test queue with a basic activate-in-order test', function(t) {
	function startTest(t) {
		var state = getTestState(t)
		var stateRouter = state.stateRouter
		t.plan(3)

		var parentActivated = false
		var cancelEvents = 0

		stateRouter.addState({
			name: 'valid',
			route: '/valid',
			template: {},
			resolve: function(data, params, cb) {
				setTimeout(cb, 100)
			},
			activate: function() {
				t.notOk(parentActivated, 'Should only activate once')
				parentActivated = true
			}
		})

		stateRouter.addState({
			name: 'valid.valid1',
			route: '/valid1',
			template: {},
			resolve: function(data, params, cb) {
				setTimeout(cb, 100)
			},
			activate: function() {
				t.fail('should not activate')
			}
		})

		stateRouter.addState({
			name: 'valid.valid2',
			route: '/valid2',
			template: {},
			activate: function() {
				t.fail('should not activate')
			}
		})

		stateRouter.addState({
			name: 'valid.valid3',
			route: '/valid3',
			template: {},
			resolve: function(data, params, cb) {
				setTimeout(cb, 100)
			},
			activate: function() {
				t.pass('valid.valid3 activated')
				t.equal(cancelEvents, 2, 'Two cancel events emitted')
				t.end()
			}
		})

		stateRouter.on('stateChangeCancelled', function(e) {
			cancelEvents++
		})

		return state
	}

	t.test('with state.go', function(t) {
		var stateRouter = startTest(t).stateRouter
		stateRouter.go('valid.valid1')
		stateRouter.go('valid.valid2')
		stateRouter.go('valid.valid3')
	})

	t.test('by changing the url', function(t) {
		var hashRouter = startTest(t).hashRouter
		hashRouter.go('/valid/valid1')
		hashRouter.go('/valid/valid2')
		hashRouter.go('/valid/valid3')
	})

	t.end()
})

test('test queue a state.go happening during a render', function(t) {
	var state = getTestState(t)
	var stateRouter = state.stateRouter
	t.plan(3)

	var parentActivated = false

	stateRouter.addState({
		name: 'valid',
		route: '/valid',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate: function() {
			t.notOk(parentActivated, 'Should only activate once')
			parentActivated = true
		}
	})

	stateRouter.addState({
		name: 'valid.valid1',
		route: '/valid1',
		template: {},
		resolve: function(data, params, cb) {
			t.pass('valid.valid1 resolve called')
			setTimeout(cb, 100)
			process.nextTick(function() {
				stateRouter.go('valid.valid2')
			})
		},
		activate: function() {
			t.fail('should not activate')
		}
	})

	stateRouter.addState({
		name: 'valid.valid2',
		route: '/valid2',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate: function() {
			t.pass('valid.valid2 activated')
			t.end()
		}
	})

	stateRouter.go('valid.valid1')
})

test('test queue a state.go when the last transition is in the middle of activating', function(t) {
	var state = getTestState(t)
	var stateRouter = state.stateRouter
	t.plan(4)

	var firstTimeParentHasBeenActivated = true
	var valid2Activated = false

	stateRouter.addState({
		name: 'valid',
		route: '/valid',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate: function() {
			if (firstTimeParentHasBeenActivated) {
				stateRouter.go('valid.valid2')
				firstTimeParentHasBeenActivated = false
			}
		}
	})

	stateRouter.addState({
		name: 'valid.valid1',
		route: '/valid1',
		template: {},
		resolve: function(data, params, cb) {
			t.pass('valid.valid1 resolve called')
			setTimeout(cb, 100)
		},
		activate: function() {
			t.notOk(valid2Activated, 'valid2 should not be activated yet')
			t.pass('valid.valid1 should activate')
		}
	})

	stateRouter.addState({
		name: 'valid.valid2',
		route: '/valid2',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 50)
		},
		activate: function() {
			valid2Activated = true
			t.pass('valid.valid2 activated')
			t.end()
		}
	})

	stateRouter.go('valid.valid1')
})
