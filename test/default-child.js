const test = require('tape-catch')
const getTestState = require('./helpers/test-state-factory')


function resolve(data, parameters, cb) {
	setTimeout(cb, 5, null)
}

function RememberActivation(location) {
	let lastActivatedState = ''
	let lastLocation = ''
	function activate(stateName) {
		return function stateActivated() {
			lastActivatedState = stateName
			lastLocation = location.get()
		}
	}
	function onEnd(t, stateName, expectedUrl) {
		return function assertions() {
			t.equal(lastActivatedState, stateName, 'last activated state should be "' + stateName + '"')
			t.equal(lastLocation, expectedUrl, 'last observed url should be "' + lastLocation + '"')
			t.end()
		}
	}
	return {
		activate,
		onEnd,
	}
}


test('default grandchild', function(t) {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	const remember = RememberActivation(testState.location)

	stateRouter.addState({
		name: 'hey',
		route: '/hay',
		defaultChild: 'rofl',
		template: {},
		resolve: resolve,
		activate: remember.activate('hey'),
	})

	stateRouter.addState({
		name: 'hey.rofl',
		route: '/routeButt',
		defaultChild: 'copter',
		template: {},
		resolve: resolve,
		querystringParameters: [ 'wat' ],
		activate: remember.activate('rofl'),
	})

	stateRouter.addState({
		name: 'hey.rofl.copter',
		route: '/lolcopter',
		template: {},
		resolve: resolve,
		activate: remember.activate('copter'),
	})

	stateRouter.addState({
		name: 'hey.rofl.cat',
		route: '/lolcat',
		template: {},
		resolve: resolve,
		activate: remember.activate('cat'),
	})

	t.test('hey -> hey.rofl.copter', function(tt) {
		stateRouter.once('stateChangeEnd', remember.onEnd(tt, 'copter', '/hay/routeButt/lolcopter'))
		stateRouter.go('hey')
	})

	t.test('hey.rofl -> hey.rofl.copter', function(tt) {
		stateRouter.once('stateChangeEnd', remember.onEnd(tt, 'copter', '/hay/routeButt/lolcopter'))
		stateRouter.go('hey.rofl')
	})

	t.test('hey.rofl.cat -> hey.rofl.cat', function(tt) {
		stateRouter.once('stateChangeEnd', remember.onEnd(tt, 'cat', '/hay/routeButt/lolcat'))
		stateRouter.go('hey.rofl.cat')
	})
})


test('bad defaults', function(t) {
	const stateRouter = getTestState(t).stateRouter

	t.plan(2)

	t.timeoutAfter(3000)

	stateRouter.addState({
		name: 'hey',
		route: '/hay',
		defaultChild: 'nonexistent',
		template: {},
		resolve: resolve,
		activate: function() {
			t.fail('Should not activate')
		},
	})

	stateRouter.on('stateError', function(e) {
		t.pass('Defaulting to a nonexistent state should cause an error to be emitted')
		t.notEqual(e.message.indexOf('nonexistent'), -1, 'the invalid state name is in the error message')
		t.end()
	})

	stateRouter.go('hey')
})


test('functions as parameters', function(t) {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	const remember = RememberActivation(testState.location)

	stateRouter.addState({
		name: 'hey',
		route: '/hay',
		defaultChild: function() {
			return 'rofl'
		},
		template: {},
		resolve: resolve,
		activate: remember.activate('hey'),
	})

	stateRouter.addState({
		name: 'hey.rofl',
		route: '/routeButt',
		template: {},
		resolve: resolve,
		querystringParameters: [ 'wat' ],
		activate: remember.activate('rofl'),
	})

	t.test('hey -> hey', function(tt) {
		stateRouter.once('stateChangeEnd', remember.onEnd(tt, 'rofl', '/hay/routeButt'))
		stateRouter.go('hey')
	})
})

test('the default child should activate even if it has an empty route string', function(t) {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	const remember = RememberActivation(testState.location)

	t.timeoutAfter(5000)

	stateRouter.addState({
		name: 'hey',
		route: '/hay',
		defaultChild: 'rofl',
		template: {},
		activate: remember.activate('hey'),
	})

	stateRouter.addState({
		name: 'hey.wrong1',
		template: {},
		activate: remember.activate('wrong1'),
	})

	stateRouter.addState({
		name: 'hey.rofl',
		route: '',
		template: {},
		activate: remember.activate('rofl'),
	})

	stateRouter.addState({
		name: 'hey.wrong2',
		template: {},
		activate: remember.activate('wrong2'),
	})

	t.test('hey -> hey', function(tt) {
		tt.timeoutAfter(5000)
		stateRouter.once('stateChangeEnd', remember.onEnd(tt, 'rofl', '/hay/'))
		stateRouter.go('hey')
	})
})

test('the default child should activate even if it doesn\'t have a route string', function(t) {
	function setupState(tt, roflRoute) {
		const testState = getTestState(tt)
		const stateRouter = testState.stateRouter
		const remember = RememberActivation(testState.location)
		testState.remember = remember

		tt.timeoutAfter(5000)

		stateRouter.addState({
			name: 'hey',
			route: '/hay',
			defaultChild: 'rofl',
			template: {},
			activate: remember.activate('hey'),
		})

		stateRouter.addState({
			name: 'hey.wrong1',
			template: {},
			activate: remember.activate('wrong1'),
		})

		stateRouter.addState({
			name: 'hey.rofl',
			template: {},
			route: roflRoute,
			activate: remember.activate('rofl'),
		})

		stateRouter.addState({
			name: 'hey.wrong2',
			template: {},
			activate: remember.activate('wrong2'),
		})

		return testState
	}

	t.test('undefined child route with state.go(hey)', function(tt) {
		const testState = setupState(tt)
		testState.stateRouter.once('stateChangeEnd', testState.remember.onEnd(tt, 'rofl', '/hay/'))
		testState.stateRouter.go('hey')
	})

	t.test('undefined child route with location.go(/hay)', function(tt) {
		const testState = setupState(tt)
		testState.stateRouter.once('stateChangeEnd', testState.remember.onEnd(tt, 'rofl', '/hay/'))
		testState.location.go('/hay')
	})

	t.test('undefined child route with location.go(/hay/)', function(tt) {
		const testState = setupState(tt)
		testState.stateRouter.once('stateChangeEnd', testState.remember.onEnd(tt, 'rofl', '/hay/'))
		testState.location.go('/hay/')
	})

	t.test('empty child route with state.go(hey)', function(tt) {
		const testState = setupState(tt, '')
		testState.stateRouter.once('stateChangeEnd', testState.remember.onEnd(tt, 'rofl', '/hay/'))
		testState.stateRouter.go('hey')
	})

	t.test('empty child route with location.go(/hay)', function(tt) {
		const testState = setupState(tt, '')
		testState.stateRouter.once('stateChangeEnd', testState.remember.onEnd(tt, 'rofl', '/hay/'))
		testState.location.go('/hay')
	})

	t.test('empty child route with location.go(/hay/)', function(tt) {
		const testState = setupState(tt, '')
		testState.stateRouter.once('stateChangeEnd', testState.remember.onEnd(tt, 'rofl', '/hay/'))
		testState.location.go('/hay/')
	})
})
