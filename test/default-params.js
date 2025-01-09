import test from 'tape-catch'
import getTestState from './helpers/test-state-factory.js'

test(`default querystring parameters`, t => {
	function basicTest(testName, params, expectParams, expectLocation, defaultParamsPropertyName) {
		t.test(testName, tt => {
			const state = getTestState(tt)
			const stateRouter = state.stateRouter
			tt.plan(2)

			const asrState = {
				name: `state`,
				route: `/state`,
				template: {},
				querystringParameters: [ `wat`, `much` ],
				activate(context) {
					tt.deepEqual(context.parameters, expectParams)
					tt.equal(state.location.get(), expectLocation)
					tt.end()
				},
			}

			asrState[defaultParamsPropertyName] = { wat: `lol`, much: `neat` },

			stateRouter.addState(asrState)

			stateRouter.go(`state`, params)
		})
	}

	function testWithBothPropertyNames(testName, params, expectParams, expectLocation) {
		basicTest(testName, params, expectParams, expectLocation, `defaultQuerystringParameters`)
		basicTest(testName, params, expectParams, expectLocation, `defaultParameters`)
	}

	testWithBothPropertyNames(
		`params override defaults`,
		{ wat: `waycool`, much: `awesome`, hi: `world` },
		{ wat: `waycool`, much: `awesome`, hi: `world` },
		`/state?hi=world&much=awesome&wat=waycool`,
	)

	testWithBothPropertyNames(
		`defaults and params are applied`,
		{ wat: `roflol` },
		{ wat: `roflol`, much: `neat` },
		`/state?much=neat&wat=roflol`,
	)

	testWithBothPropertyNames(
		`defaults are applied`,
		{},
		{ wat: `lol`, much: `neat` },
		`/state?much=neat&wat=lol`,
	)
})

test(`race conditions on redirects`, t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter
	t.plan(4)

	stateRouter.addState({
		name: `state1`,
		route: `/state1`,
		template: {},
		querystringParameters: [ `wat`, `much` ],
		defaultQuerystringParameters: { wat: `lol`, much: `neat` },
		activate(context) {
			t.deepEqual({ wat: `lol`, much: `neat` }, context.parameters)
			t.equal(state.location.get(), `/state1?much=neat&wat=lol`)

			stateRouter.go(`state2`, { wat: `waycool`, much: `awesome`, hi: `world` }) // does not redirect
		},
	})

	stateRouter.addState({
		name: `state2`,
		route: `/state2`,
		template: {},
		querystringParameters: [ `wat`, `much` ],
		defaultQuerystringParameters: { wat: `lol`, much: `neat` },
		activate(context) {
			t.deepEqual({ wat: `waycool`, much: `awesome`, hi: `world` }, context.parameters)
			t.equal(state.location.get(), `/state2?hi=world&much=awesome&wat=waycool`)

			t.end()
		},
	})

	stateRouter.go(`state1`, {}) // redirects
})

test(`default parameters should work for route params too`, t => {
	function testWithPropertyName(property) {
		t.test(property, tt => {
			const state = getTestState(tt)
			const stateRouter = state.stateRouter

			const asrState = {
				name: `state1`,
				route: `/state1/:yarp`,
				template: {},
				querystringParameters: [ `wat` ],
				activate(context) {
					tt.deepEqual({ wat: `lol`, yarp: `neat` }, context.parameters)
					tt.equal(state.location.get(), `/state1/neat?wat=lol`)

					tt.end()
				},
			}

			asrState[property] = { wat: `lol`, yarp: `neat` }

			stateRouter.addState(asrState)

			stateRouter.go(`state1`, {})
		})
	}

	testWithPropertyName(`defaultParameters`)
	testWithPropertyName(`defaultQuerystringParameters`)
})

test(`default parameters should work for default child route params`, t => {
	function testWithPropertyName(property) {
		t.test(property, tt => {
			const state = getTestState(tt)
			const stateRouter = state.stateRouter

			stateRouter.addState({
				name: `state1`,
				route: `/state1`,
				defaultChild: `child1`,
				template: {},
			})

			const asrState = {
				name: `state1.child1`,
				route: `/:yarp`,
				template: {},
				querystringParameters: [ `wat` ],
				activate(context) {
					tt.deepEqual({ wat: `lol`, yarp: `neat` }, context.parameters)
					tt.equal(state.location.get(), `/state1/neat?wat=lol`)

					tt.end()
				},
			}

			asrState[property] = { wat: `lol`, yarp: `neat` }

			stateRouter.addState(asrState)

			stateRouter.go(`state1`, {})
		})
	}

	testWithPropertyName(`defaultParameters`)
	testWithPropertyName(`defaultQuerystringParameters`)
})

test(`default parameters on parent states should apply to child state routes`, t => {
	function testWithPropertyName(property) {
		t.test(property, tt => {
			const state = getTestState(tt)
			const stateRouter = state.stateRouter

			const parentState = {
				name: `state1`,
				route: `/state1`,
				defaultChild: `child1`,
				template: {},
			}

			parentState[property] = { wat: `lol`, yarp: `neat` }

			stateRouter.addState(parentState)

			stateRouter.addState({
				name: `state1.child1`,
				route: `/:yarp`,
				template: {},
				querystringParameters: [ `wat` ],
				activate(context) {
					tt.deepEqual({ wat: `lol`, yarp: `neat` }, context.parameters)
					tt.equal(state.location.get(), `/state1/neat?wat=lol`)

					tt.end()
				},
			})

			stateRouter.go(`state1`, {})
		})
	}

	testWithPropertyName(`defaultParameters`)
	testWithPropertyName(`defaultQuerystringParameters`)
})

test(`empty string is a valid default parameter`, t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter

	stateRouter.addState({
		name: `state`,
		route: `/state`,
		template: {},
		defaultParameters: {
			someParam: ``,
		},
		querystringParameters: [ `someParam` ],
		activate(context) {
			t.equal(context.parameters.someParam, ``)
			t.equal(state.location.get(), `/state?someParam=`)

			t.end()
		},
	})

	stateRouter.go(`state`)
}, {
	timeout: 1000,
})

test(`function is a valid default parameter, which returns the default value`, t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter

	stateRouter.addState({
		name: `state`,
		route: `/state`,
		template: {},
		defaultParameters: {
			someParam: `foo`,
			someOtherParam: () => `bar` + `baz`,
		},
		querystringParameters: [ `someParam`, `someOtherParam` ],
		activate(context) {
			t.equal(context.parameters.someParam, `foo`)
			t.equal(context.parameters.someOtherParam, `barbaz`)
			t.equal(state.location.get(), `/state?someOtherParam=barbaz&someParam=foo`)

			t.end()
		},
	})

	stateRouter.go(`state`)
})
