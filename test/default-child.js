var test = require('tape')
var getTestState = require('./helpers/test-state-factory')
var extend = require('extend')


function resolve(data, parameters, cb) {
	setTimeout(cb, 5, null)
}

function RememberActivation() {
	var last = ''
	function set(str) {
		return function s() { last = str }
	}
	function get(tt, str) {
		return function g() {
			var msg = 'last activated state should be "' + str + '"'
			tt.equal(str, last, msg)
			tt.end()
		}
	}
	return {
		activate: set,
		onEnd: get
	}
}


test('default grandchild', function (t) {
	var stateRouter = getTestState(t).stateRouter
	var remember = RememberActivation()

	stateRouter.addState({
		name: 'hey',
		route: '/hay',
		defaultChild: 'rofl',
		template: {},
		resolve: resolve,
		activate: remember.activate('hey')
	})

	stateRouter.addState({
		name: 'hey.rofl',
		route: '/routeButt',
		defaultChild: 'copter',
		template: {},
		resolve: resolve,
		querystringParameters: ['wat'],
		activate: remember.activate('rofl')
	})

	stateRouter.addState({
		name: 'hey.rofl.copter',
		route: '/lolcopter',
		template: {},
		resolve: resolve,
		activate: remember.activate('copter')
	})

	stateRouter.addState({
		name: 'hey.rofl.cat',
		route: '/lolcat',
		template: {},
		resolve: resolve,
		activate: remember.activate('cat')
	})

	t.test('hey -> hey.rofl.copter', function (tt) {
		stateRouter.once('stateChangeEnd', remember.onEnd(tt, 'copter'))
		stateRouter.go('hey')
	})

	t.test('hey.rofl -> hey.rofl.copter', function (tt) {
		stateRouter.once('stateChangeEnd', remember.onEnd(tt, 'copter'))
		stateRouter.go('hey.rofl')
	})

	t.test('hey.rofl.cat -> hey.rofl.cat', function (tt) {
		stateRouter.once('stateChangeEnd', remember.onEnd(tt, 'cat'))
		stateRouter.go('hey.rofl.cat')
	})
})


test('bad defaults', function (t) {
	var stateRouter = getTestState(t).stateRouter
	var remember = RememberActivation()

	stateRouter.addState({
		name: 'hey',
		route: '/hay',
		defaultChild: 'nonexistent',
		template: {},
		resolve: resolve,
		activate: remember.activate('hey')
	})

	t.test('hey -> hey', function (tt) {
		stateRouter.once('stateChangeEnd', remember.onEnd(tt, 'hey'))
		stateRouter.go('hey')
	})
})


test('functions as parameters', function (t) {
	var stateRouter = getTestState(t).stateRouter
	var remember = RememberActivation()

	stateRouter.addState({
		name: 'hey',
		route: '/hay',
		defaultChild: function () {return 'rofl'},
		template: {},
		resolve: resolve,
		activate: remember.activate('hey')
	})

	stateRouter.addState({
		name: 'hey.rofl',
		route: '/routeButt',
		template: {},
		resolve: resolve,
		querystringParameters: ['wat'],
		activate: remember.activate('rofl')
	})

	t.test('hey -> hey', function (tt) {
		stateRouter.once('stateChangeEnd', remember.onEnd(tt, 'rofl'))
		stateRouter.go('hey')
	})
})
