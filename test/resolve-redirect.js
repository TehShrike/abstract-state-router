var test = require('tape-catch')
var getTestState = require('./helpers/test-state-factory')

test('test redirector chain', function(t) {
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
				setTimeout(cb, 50)
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
				setTimeout(cb.redirect, 100, 'valid.valid2')
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
				setTimeout(cb.redirect, 100, 'valid.valid3')
			},
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
	})

	t.test('by changing the url', function(t) {
		var hashRouter = startTest(t).hashRouter
		hashRouter.go('/valid/valid1')
	})

	t.end()
})

test('test redirector chain', function(t) {
	function startTest(t) {
		var state = getTestState(t)
		var stateRouter = state.stateRouter
		t.plan(2)

		var cancelEvents = 0

		stateRouter.addState({
			name: 'valid',
			route: '/valid',
			template: {},
			resolve: function(data, params, cb) {
				setTimeout(cb, 50)
			},
			activate: function() {}
		})

		stateRouter.addState({
			name: 'valid.valid1',
			route: '/valid1',
			template: {},
			resolve: function(data, params, cb) {
				cb.redirect('valid.valid3')
				cb.redirect('valid.valid2')
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
				t.equal(cancelEvents, 1, 'One cancel event emitted')
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
	})

	t.test('by changing the url', function(t) {
		var hashRouter = startTest(t).hashRouter
		hashRouter.go('/valid/valid1')
	})

	t.end()
})
