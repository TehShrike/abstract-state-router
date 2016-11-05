var test = require('tape-catch')
var getTestState = require('./helpers/test-state-factory')

test('default querystring parameters', function(t) {
	function basicTest(testName, params, expectParams, expectLocation, defaultParamsPropertyName) {
		t.test(testName, function(tt) {
			var state = getTestState(tt)
			var stateRouter = state.stateRouter
			tt.plan(2)

			var asrState = {
				name: 'state',
				route: '/state',
				template: {},
				querystringParameters: [ 'wat', 'much' ],
				activate: function(context) {
					tt.deepEqual(context.parameters, expectParams)
					tt.equal(state.location.get(), expectLocation)
					tt.end()
				}
			}

			asrState[defaultParamsPropertyName] = { wat: 'lol', much: 'neat' },

			stateRouter.addState(asrState)

			stateRouter.go('state', params)
		})
	}

	function testWithBothPropertyNames(testName, params, expectParams, expectLocation) {
		basicTest(testName, params, expectParams, expectLocation, 'defaultQuerystringParameters')
		basicTest(testName, params, expectParams, expectLocation, 'defaultParameters')
	}

	testWithBothPropertyNames(
		'params override defaults',
		{ wat: 'waycool', much: 'awesome', hi: 'world' },
		{ wat: 'waycool', much: 'awesome', hi: 'world' },
		'/state?wat=waycool&much=awesome&hi=world'
	)

	testWithBothPropertyNames(
		'defaults and params are applied',
		{ wat: 'roflol'},
		{ wat: 'roflol', much: 'neat'},
		'/state?wat=roflol&much=neat'
	)

	testWithBothPropertyNames(
		'defaults are applied',
		{},
		{ wat: 'lol', much: 'neat'},
		'/state?wat=lol&much=neat'
	)
})

test('race conditions on redirects', function(t) {
	var state = getTestState(t)
	var stateRouter = state.stateRouter
	t.plan(4)

	stateRouter.addState({
		name: 'state1',
		route: '/state1',
		template: {},
		querystringParameters: [ 'wat', 'much' ],
		defaultQuerystringParameters: { wat: 'lol', much: 'neat' },
		activate: function(context) {
			t.deepEqual({ wat: 'lol', much: 'neat' }, context.parameters)
			t.equal(state.location.get(), '/state1?wat=lol&much=neat')

			stateRouter.go('state2', { wat: 'waycool', much: 'awesome', hi: 'world' }) //does not redirect
		}
	})

	stateRouter.addState({
		name: 'state2',
		route: '/state2',
		template: {},
		querystringParameters: [ 'wat', 'much' ],
		defaultQuerystringParameters: { wat: 'lol', much: 'neat' },
		activate: function(context) {
			t.deepEqual({ wat: 'waycool', much: 'awesome', hi: 'world' }, context.parameters)
			t.equal(state.location.get(), '/state2?wat=waycool&much=awesome&hi=world')

			t.end()
		}
	})


	stateRouter.go('state1', {}) //redirects

})

test('default parameters should work for route params too', function(t) {
	function testWithPropertyName(property) {
		t.test(property, function(tt) {
			var state = getTestState(tt)
			var stateRouter = state.stateRouter

			var asrState = {
				name: 'state1',
				route: '/state1/:yarp',
				template: {},
				querystringParameters: [ 'wat' ],
				activate: function(context) {
					tt.deepEqual({ wat: 'lol', yarp: 'neat' }, context.parameters)
					tt.equal(state.location.get(), '/state1/neat?wat=lol')

					tt.end()
				}
			}

			asrState[property] = { wat: 'lol', yarp: 'neat' }

			stateRouter.addState(asrState)

			stateRouter.go('state1', {})
		})
	}

	testWithPropertyName('defaultParameters')
	testWithPropertyName('defaultQuerystringParameters')
})

test('default parameters should work for default child route params', function(t) {
	function testWithPropertyName(property) {
		t.test(property, function(tt) {
			var state = getTestState(tt)
			var stateRouter = state.stateRouter

			stateRouter.addState({
				name: 'state1',
				route: '/state1',
				defaultChild: 'child1',
				template: {}
			})

			var asrState = {
				name: 'state1.child1',
				route: '/:yarp',
				template: {},
				querystringParameters: [ 'wat' ],
				activate: function(context) {
					tt.deepEqual({ wat: 'lol', yarp: 'neat' }, context.parameters)
					tt.equal(state.location.get(), '/state1/neat?wat=lol')

					tt.end()
				}
			}

			asrState[property] = { wat: 'lol', yarp: 'neat' }

			stateRouter.addState(asrState)

			stateRouter.go('state1', {})
		})
	}

	testWithPropertyName('defaultParameters')
	testWithPropertyName('defaultQuerystringParameters')
})

test('default parameters on parent states should apply to child state routes', function(t) {
	function testWithPropertyName(property) {
		t.test(property, function(tt) {
			var state = getTestState(tt)
			var stateRouter = state.stateRouter

			var parentState = {
				name: 'state1',
				route: '/state1',
				defaultChild: 'child1',
				template: {}
			}

			parentState[property] = { wat: 'lol', yarp: 'neat' }

			stateRouter.addState(parentState)

			stateRouter.addState({
				name: 'state1.child1',
				route: '/:yarp',
				template: {},
				querystringParameters: [ 'wat' ],
				activate: function(context) {
					tt.deepEqual({ wat: 'lol', yarp: 'neat' }, context.parameters)
					tt.equal(state.location.get(), '/state1/neat?wat=lol')

					tt.end()
				}
			})

			stateRouter.go('state1', {})
		})
	}

	testWithPropertyName('defaultParameters')
	testWithPropertyName('defaultQuerystringParameters')
})

test('empty string is a valid default parameter', function(t) {
	var state = getTestState(t)
	var stateRouter = state.stateRouter

	stateRouter.addState({
		name: 'state',
		route: '/state',
		template: {},
		defaultParameters: {
			someParam: ''
		},
		querystringParameters: [ 'someParam' ],
		activate: function(context) {
			t.equal(context.parameters.someParam, '')
			t.equal(state.location.get(), '/state?someParam=')

			t.end()
		}
	})

	stateRouter.go('state')
}, {
	timeout: 1000
})
