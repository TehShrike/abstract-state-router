var test = require('tape')
var assertingRendererFactory = require('./helpers/asserting-renderer-factory')
var getTestState = require('./helpers/test-state-factory')

test('test queue with a basic activate-in-order test', function(t) {
	var stateRouter = getTestState(t).stateRouter
	t.plan(4)

	var n = 0
	function activate(x) {
		return function () {
			t.equal(x, n+=1, 'activation number ' + x)
		}
	}

	stateRouter.addState({
		name: 'valid',
		route: '/valid',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate: activate(1)
	})

	stateRouter.addState({
		name: 'valid.valid1',
		route: '/valid1',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate: activate(2)
	})

	stateRouter.addState({
		name: 'valid.valid2',
		route: '/valid2',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate: activate(3)
	})

	stateRouter.addState({
		name: 'valid.valid3',
		route: '/valid3',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate: activate(4)
	})

	stateRouter.go('valid.valid1')
	stateRouter.go('valid.valid2')
	stateRouter.go('valid.valid3')
})


test('test queue with a basic activate-in-order test using the hash router', function(t) {
	var state = getTestState(t)
	var stateRouter = state.stateRouter
	var hashRouter = state.hashRouter

	var n = 0
	function activate(x) {
		return function () {
			t.equal(x, n+=1, 'activation number ' + x)
		}
	}

	t.plan(4)

	stateRouter.addState({
		name: 'valid',
		route: '/valid',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 20)
		},
		activate: activate(1)
	})

	stateRouter.addState({
		name: 'valid.valid1',
		route: '/valid1',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 10)
		},
		activate: activate(2)
	})

	stateRouter.addState({
		name: 'valid.valid2',
		route: '/valid2',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 10)
		},
		activate: activate(3)
	})

	stateRouter.addState({
		name: 'valid.valid3',
		route: '/valid3',
		template: {},
		resolve: function(data, params, cb) {
			setTimeout(cb, 10)
		},
		activate: activate(4)
	})

	hashRouter.go('/valid/valid1')
	hashRouter.go('/valid/valid2')
	hashRouter.go('/valid/valid3')
})


test('test queue with an asserting renderer', function(t) {
	var parentTemplate = {}
	var child1Template = {}
	var child2Template = {}
	var child3Template = {}
	var parentActivated = false
	var child1Activated = false
	var child2Activated = false
	var child3Activated = false

	var renderer = assertingRendererFactory(t, [
		parentTemplate,
		child1Template,
		child2Template,
		child3Template
	])

	var state = getTestState(t, renderer)
	var stateRouter = state.stateRouter
	var assertsBelow = 8
	var renderAsserts = renderer.expectedAssertions
	var n = 0

	t.plan(assertsBelow + renderAsserts)

	stateRouter.addState({
		name: 'valid',
		route: '/valid',
		template: parentTemplate,
		resolve: function(data, params, cb) {
			setTimeout(cb, 20)
		},
		activate: function(context) {
			t.notOk(parentActivated, 'parent activated once')
			parentActivated = true
			t.equal(n+=1, 1, 'first thing activated')
		}
	})

	stateRouter.addState({
		name: 'valid.valid1',
		route: '/valid1',
		template: child1Template,
		resolve: function(data, params, cb) {
			setTimeout(cb, 10)
		},
		activate: function(context) {
			t.notOk(child1Activated, 'child1 activated once')
			child1Activated = true
			t.equal(n+=1, 2, 'second thing activated')
		}
	})

	stateRouter.addState({
		name: 'valid.valid2',
		route: '/valid2',
		template: child2Template,
		resolve: function(data, params, cb) {
			setTimeout(cb, 10)
		},
		activate: function(context) {
			t.notOk(child2Activated, 'child2 activated once')
			child2Activated = true
			t.equal(n+=1, 3, 'third thing activated')
		}
	})

	stateRouter.addState({
		name: 'valid.valid3',
		route: '/valid3',
		template: child3Template,
		resolve: function(data, params, cb) {
			setTimeout(cb, 10)
		},
		activate: function(context) {
			t.notOk(child3Activated, 'child3 activated once')
			child3Activated = true
			t.equal(n+=1, 4, 'fourth thing activated')

			t.end()
		}
	})

	stateRouter.go('valid.valid1')
	stateRouter.go('valid.valid2')
	stateRouter.go('valid.valid3')

	setTimeout(function() {}, 1000)
})
