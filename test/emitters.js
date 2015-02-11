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
				template: null,
				activate: function(context) {
					t.fail('Should never activate the parent\'s state')
				}
			})

			stateRouter.addState({
				name: 'valid.valid',
				route: '/valid',
				template: null,
				activate: function(context) {
					t.fail('Should never activate the child\'s state')
				}
			})

			stateRouter.on('stateChangeError', function(e) {
				t.notEqual(e.message.indexOf(invalidStateName), -1, 'invalid state name is in the error message')
				t.end()
			})

			stateRouter.go(invalidStateName, {})
		})
	}

	testGoingTo('All states invalid', 'invalid.also-invalid')
	testGoingTo('Only the child state invalid', 'valid.invalid')
})

test('Emitting stateChangeStart and stateChangeEnd', function(t) {
	var parent1Template = {}
	var child1Template = {}
	var parent2Template = {}
	var child2Template = {}
	var firstProperties = { one: 'wat' }
	var secondProperties = { two: 'wat' }
	var renderer = assertingRendererFactory(t, [ parent1Template, child1Template, parent2Template, child2Template ])
	var state = getTestState(t, renderer)
	var stateRouter = state.stateRouter
	var assertsBelow = 24
	var renderAsserts = renderer.expectedAssertions

	t.plan(assertsBelow + renderAsserts)

	var firstParentActivate = false
	var firstChildActivate = false
	var secondParentActivate = false
	var secondChildActivate = false

	stateRouter.addState({
		name: 'valid1',
		route: '/valid1',
		template: parent1Template,
		activate: function(context) {
			firstParentActivate = true
		}
	})

	stateRouter.addState({
		name: 'valid1.valid',
		route: '/valid1',
		template: child1Template,
		activate: function(context) {
			firstChildActivate = true
		}
	})

	stateRouter.addState({
		name: 'valid2',
		route: '/valid2',
		template: parent2Template,
		activate: function(context) {
			secondParentActivate = true
		}
	})

	stateRouter.addState({
		name: 'valid2.valid',
		route: '/valid2',
		template: child2Template,
		activate: function(context) {
			secondChildActivate = true
		}
	})

	stateRouter.once('stateChangeStart', function(name, properties) {
		t.equal(name, 'valid1.valid')
		t.deepEqual(properties, firstProperties)
		t.notOk(firstParentActivate)
		t.notOk(firstChildActivate)
		t.notOk(secondParentActivate)
		t.notOk(secondChildActivate)
	})

	stateRouter.once('stateChangeEnd', function(name, properties) {
		t.equal(name, 'valid1.valid')
		t.deepEqual(properties, firstProperties)
		t.ok(firstParentActivate)
		t.ok(firstChildActivate)
		t.notOk(secondParentActivate)
		t.notOk(secondChildActivate)

		stateRouter.once('stateChangeStart', function(name, properties) {
			t.equal(name, 'valid2.valid')
			t.deepEqual(properties, secondProperties)
			t.ok(firstParentActivate)
			t.ok(firstChildActivate)
			t.notOk(secondParentActivate)
			t.notOk(secondChildActivate)
		})

		stateRouter.once('stateChangeEnd', function(name, properties) {
			t.equal(name, 'valid2.valid')
			t.deepEqual(properties, secondProperties)
			t.ok(firstParentActivate)
			t.ok(firstChildActivate)
			t.ok(secondParentActivate)
			t.ok(secondChildActivate)

			t.end()
		})

		stateRouter.go('valid2.valid', secondProperties)
	})

	stateRouter.go('valid1.valid', firstProperties)
})

test('emitting stateChangeError', function(t) {
	var parent1Template = {}
	var child1Template = {}
	var renderer = assertingRendererFactory(t, [ ])
	var state = getTestState(t, renderer)
	var stateRouter = state.stateRouter
	var assertsBelow = 1
	var renderAsserts = renderer.expectedAssertions
	var error1 = new Error('first')
	var error2 = new Error('second')

	t.plan(assertsBelow + renderAsserts)

	stateRouter.addState({
		name: 'valid1',
		route: '/valid1',
		template: parent1Template,
		resolve: function() {
			throw error1
		},
		activate: function(context) {
			t.fail('should not activate')
		}
	})

	stateRouter.addState({
		name: 'valid1.valid',
		route: '/valid1',
		template: child1Template,
		resolve: function() {
			throw error2
		},
		activate: function(context) {
			t.fail('should not activate')
		}
	})

	stateRouter.on('stateChangeError', function(e) {
		t.equal(e, error1)
		t.end()
	})

	stateRouter.go('valid1.valid')
})
