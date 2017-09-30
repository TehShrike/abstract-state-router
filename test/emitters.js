const test = require('tape-catch')
const assertingRendererFactory = require('./helpers/asserting-renderer-factory')
const getTestState = require('./helpers/test-state-factory')

test('Emitting errors when attempting to navigate to invalid states', function(t) {
	function testGoingTo(description, invalidStateName) {
		t.test(description, function(t) {
			const renderer = assertingRendererFactory(t, [])
			const state = getTestState(t, renderer)
			const stateRouter = state.stateRouter
			const assertsBelow = 1
			const renderAsserts = renderer.expectedAssertions

			t.plan(assertsBelow + renderAsserts)

			stateRouter.addState({
				name: 'valid',
				route: '/valid',
				template: null,
				activate: function(context) {
					t.fail('Should never activate the parent\'s state')
				},
			})

			stateRouter.addState({
				name: 'valid.valid',
				route: '/valid',
				template: null,
				activate: function(context) {
					t.fail('Should never activate the child\'s state')
				},
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
	const parent1Template = {}
	const child1Template = {}
	const parent2Template = {}
	const child2Template = {}
	const firstProperties = { one: 'wat' }
	const secondProperties = { two: 'wat' }
	const renderer = assertingRendererFactory(t, [ parent1Template, child1Template, parent2Template, child2Template ])
	const state = getTestState(t, renderer)
	const stateRouter = state.stateRouter
	const assertsBelow = 28
	const renderAsserts = renderer.expectedAssertions

	t.plan(assertsBelow + renderAsserts)

	let firstParentActivate = false
	let firstChildActivate = false
	let secondParentActivate = false
	let secondChildActivate = false

	const valid1 = {
		name: 'valid1',
		route: '/valid1',
		template: parent1Template,
		activate: function(context) {
			firstParentActivate = true
		},
	}
	const valid1valid = {
		name: 'valid1.valid',
		route: '/valid1',
		template: child1Template,
		activate: function(context) {
			firstChildActivate = true
		},
	}

	const valid2 = {
		name: 'valid2',
		route: '/valid2',
		template: parent2Template,
		activate: function(context) {
			secondParentActivate = true
		},
	}

	const valid2valid = {
		name: 'valid2.valid',
		route: '/valid2',
		template: child2Template,
		activate: function(context) {
			secondChildActivate = true
		},
	}

	stateRouter.addState(valid1)
	stateRouter.addState(valid1valid)
	stateRouter.addState(valid2)
	stateRouter.addState(valid2valid)

	stateRouter.once('stateChangeStart', function(state, properties, states) {
		t.equal(state.name, 'valid1.valid')
		t.deepEqual(properties, firstProperties)
		t.notOk(firstParentActivate)
		t.notOk(firstChildActivate)
		t.notOk(secondParentActivate)
		t.notOk(secondChildActivate)

		t.deepEqual(states, [ valid1, valid1valid ])
	})

	stateRouter.once('stateChangeEnd', function(state, properties, states) {
		t.equal(state.name, 'valid1.valid')
		t.deepEqual(properties, firstProperties)
		t.ok(firstParentActivate)
		t.ok(firstChildActivate)
		t.notOk(secondParentActivate)
		t.notOk(secondChildActivate)

		t.deepEqual(states, [ valid1, valid1valid ])

		stateRouter.once('stateChangeStart', function(state, properties, states) {
			t.equal(state.name, 'valid2.valid')
			t.deepEqual(properties, secondProperties)
			t.ok(firstParentActivate)
			t.ok(firstChildActivate)
			t.notOk(secondParentActivate)
			t.notOk(secondChildActivate)

			t.deepEqual(states, [ valid2, valid2valid ])
		})

		stateRouter.once('stateChangeEnd', function(state, properties, states) {
			t.equal(state.name, 'valid2.valid')
			t.deepEqual(properties, secondProperties)
			t.ok(firstParentActivate)
			t.ok(firstChildActivate)
			t.ok(secondParentActivate)
			t.ok(secondChildActivate)

			t.deepEqual(states, [ valid2, valid2valid ])

			t.end()
		})

		stateRouter.go('valid2.valid', secondProperties)
	})

	stateRouter.go('valid1.valid', firstProperties)
})

test('emitting stateChangeError', function(t) {
	const parent1Template = {}
	const child1Template = {}
	const renderer = assertingRendererFactory(t, [ ])
	const state = getTestState(t, renderer)
	const stateRouter = state.stateRouter
	const assertsBelow = 1
	const renderAsserts = renderer.expectedAssertions
	const error1 = new Error('first')
	const error2 = new Error('second')

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
		},
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
		},
	})

	stateRouter.on('stateChangeError', function(e) {
		t.equal(e, error1)
		t.end()
	})

	stateRouter.go('valid1.valid')
})

test('emitting dom api create', function(t) {
	const originalDomApi = {}
	let renderCalled = false
	let beforeEventFired = false
	let afterEventFired = false

	t.plan(16)

	const state = getTestState(t, function() {
		return {
			render: function(context, cb) {
				t.ok(beforeEventFired)
				renderCalled = true
				t.notOk(afterEventFired)
				cb(null, originalDomApi)
			},
			reset: function(context, cb) {
				cb(null)
			},
			destroy: function(renderedTemplateApi, cb) {
				cb(null)
			},
			getChildElement: function getChildElement(renderedTemplateApi, cb) {
				cb(null, {})
			},
		}
	})

	const stateRouter = state.stateRouter

	const originalStateObject = {
		name: 'state',
		route: '/state',
		template: {},
		querystringParameters: [ 'wat', 'much' ],
		defaultQuerystringParameters: { wat: 'lol', much: 'neat' },
		resolve: function(data, params, cb) {
			cb(null, {
				value: 'legit',
			})
		},
	}

	stateRouter.addState(originalStateObject)

	stateRouter.on('beforeCreateState', function(context) {
		t.notOk(renderCalled)
		t.notOk(afterEventFired)
		t.notOk(beforeEventFired)
		beforeEventFired = true

		t.equal(context.state, originalStateObject)
		t.equal(context.content.value, 'legit')
		t.equal(context.parameters.thingy, 'yes')
		t.notOk(context.domApi)
	})
	stateRouter.on('afterCreateState', function(context) {
		t.ok(beforeEventFired)
		t.ok(renderCalled)
		t.notOk(afterEventFired)
		afterEventFired = true

		t.equal(context.state, originalStateObject)
		t.equal(context.content.value, 'legit')
		t.equal(context.parameters.thingy, 'yes')
		t.equal(context.domApi, originalDomApi)

		t.end()
	})

	stateRouter.go('state', {
		thingy: 'yes',
	})
})

test('emitting dom api destroy', function(t) {
	const originalDomApi = {}
	let beforeEventFired = false
	let afterEventFired = false
	let destroyCalled = false

	const state = getTestState(t, function() {
		return {
			render: function(context, cb) {
				cb(null, originalDomApi)
			},
			reset: function(context, cb) {
				cb(null)
			},
			destroy: function(renderedTemplateApi, cb) {
				t.ok(beforeEventFired)
				t.notOk(afterEventFired)
				destroyCalled = true

				cb(null)
			},
			getChildElement: function getChildElement(renderedTemplateApi, cb) {
				cb(null, {})
			},
		}
	})
	const stateRouter = state.stateRouter
	t.plan(11)

	const originalStateObject = {
		name: 'state',
		route: '/state',
		template: {},
		activate: function() {
			stateRouter.go('second-state', {})
		},
	}

	stateRouter.addState(originalStateObject)
	stateRouter.addState({
		name: 'second-state',
		route: '/second',
		template: {},
		activate: function(context) {
			t.ok(afterEventFired)
			t.end()
		},
	})

	stateRouter.on('beforeDestroyState', function(context) {
		t.notOk(destroyCalled)
		t.notOk(afterEventFired)
		beforeEventFired = true

		t.equal(context.state, originalStateObject)
		t.equal(context.domApi, originalDomApi)
	})

	stateRouter.on('afterDestroyState', function(context) {
		t.ok(beforeEventFired)
		t.ok(destroyCalled)
		afterEventFired = true

		t.equal(context.state, originalStateObject)
		t.notOk(context.domApi)
	})

	stateRouter.go('state', {})
})

test('emitting dom api reset', function(t) {
	const originalDomApi = {}
	const secondDomApi = {}
	const domApis = [ originalDomApi, secondDomApi ]
	let beforeEventFired = false
	let afterEventFired = false
	let resetCalled = false

	t.plan(16)

	const state = getTestState(t, function() {
		return {
			render: function(context, cb) {
				cb(null, domApis.shift())
			},
			reset: function(context, cb) {
				if (!resetCalled) {
					t.ok(beforeEventFired)
					t.notOk(afterEventFired)
					resetCalled = true
				}

				cb(null)
			},
			destroy: function(renderedTemplateApi, cb) {
				cb(null)
			},
			getChildElement: function getChildElement(renderedTemplateApi, cb) {
				cb(null, {})
			},
		}
	})
	const stateRouter = state.stateRouter

	const originalStateObject = {
		name: 'state',
		route: '/state',
		template: {},
		querystringParameters: [ 'wat' ],
		resolve: function(data, params, cb) {
			cb(null, {
				value: 'legit',
			})
		},
		activate: function() {
			setTimeout(function() {
				stateRouter.go('state', { wat: '20' })
			}, 10)
		},
	}

	stateRouter.addState(originalStateObject)

	stateRouter.on('beforeResetState', function(context) {
		t.notOk(beforeEventFired)
		t.notOk(resetCalled)
		t.notOk(afterEventFired)
		beforeEventFired = true

		t.equal(context.state, originalStateObject)
		t.equal(context.domApi, originalDomApi)
		t.equal(context.content.value, 'legit')
		t.equal(context.parameters.wat, '20')
	})

	stateRouter.on('afterResetState', function(context) {
		t.ok(beforeEventFired)
		t.ok(resetCalled)
		t.notOk(afterEventFired)
		afterEventFired = true

		t.equal(context.state, originalStateObject)
		t.equal(context.domApi, originalDomApi)
		t.equal(context.content.value, 'legit')
		t.equal(context.parameters.wat, '20')
		t.end()
	})

	stateRouter.go('state', { wat: '10' })
})

test('emitting routeNotFound', function(t) {
	const renderer = assertingRendererFactory(t, [])
	const state = getTestState(t, renderer)
	const stateRouter = state.stateRouter
	const assertsBelow = 2
	const renderAsserts = renderer.expectedAssertions

	t.plan(assertsBelow + renderAsserts)

	stateRouter.addState({
		name: 'valid',
		route: '/valid',
		template: null,
		activate: function(context) {
			t.fail('Should never activate the parent\'s state')
		},
	})

	stateRouter.addState({
		name: 'valid.valid',
		route: '/valid',
		template: null,
		activate: function(context) {
			t.fail('Should never activate the child\'s state')
		},
	})

	stateRouter.on('stateChangeError', function(e) {
		t.fail('Should not emit a normal error')
	})
	stateRouter.on('stateError', function(e) {
		t.fail('Should not emit a normal error')
	})

	stateRouter.on('routeNotFound', function(route, parameters) {
		t.equal(route, '/nonexistent')
		t.equal(parameters.thingy, 'stuff')
		t.end()
	})

	state.hashRouter.location.go('/nonexistent?thingy=stuff')
})
