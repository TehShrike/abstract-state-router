import { test } from 'node:test'
import assert from 'node:assert'
import getTestState from './helpers/test-state-factory.js'

test(`default querystring parameters`, async t => {
	async function basicTest(testName, params, expectParams, expectLocation, defaultParamsPropertyName) {
		await t.test(testName, async tt => {
			const state = getTestState(tt)
			const stateRouter = state.stateRouter

			const asrState = {
				name: `state`,
				route: `/state`,
				template: {},
				querystringParameters: [ `wat`, `much` ],
				activate(context) {
					assert.deepStrictEqual(context.parameters, expectParams)
					assert.strictEqual(state.location.get(), expectLocation)
				},
			}

			asrState[defaultParamsPropertyName] = { wat: `lol`, much: `neat` }

			stateRouter.addState(asrState)

			await new Promise(resolve => {
				stateRouter.once('stateChangeEnd', () => {
					resolve()
				})
				stateRouter.go(`state`, params)
			})
		})
	}

	await basicTest(
		`params override defaults`,
		{ wat: `waycool`, much: `awesome`, hi: `world` },
		{ wat: `waycool`, much: `awesome`, hi: `world` },
		`/state?hi=world&much=awesome&wat=waycool`,
		'defaultParameters',
	)

	await basicTest(
		`defaults and params are applied`,
		{ wat: `roflol` },
		{ wat: `roflol`, much: `neat` },
		`/state?much=neat&wat=roflol`,
		'defaultParameters',
	)

	await basicTest(
		`defaults are applied`,
		{},
		{ wat: `lol`, much: `neat` },
		`/state?much=neat&wat=lol`,
		'defaultParameters',
	)
})

test(`race conditions on redirects`, async t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter

	stateRouter.addState({
		name: `state1`,
		route: `/state1`,
		template: {},
		querystringParameters: [ `wat`, `much` ],
		defaultParameters: { wat: `lol`, much: `neat` },
		activate(context) {
			assert.deepStrictEqual({ wat: `lol`, much: `neat` }, context.parameters)
			assert.strictEqual(state.location.get(), `/state1?much=neat&wat=lol`)

			stateRouter.go(`state2`, { wat: `waycool`, much: `awesome`, hi: `world` }) // does not redirect
		},
	})

	await new Promise(resolve => {
		stateRouter.addState({
			name: `state2`,
			route: `/state2`,
			template: {},
			querystringParameters: [ `wat`, `much` ],
			defaultParameters: { wat: `lol`, much: `neat` },
			activate(context) {
				assert.deepStrictEqual({ wat: `waycool`, much: `awesome`, hi: `world` }, context.parameters)
				assert.strictEqual(state.location.get(), `/state2?hi=world&much=awesome&wat=waycool`)
				resolve()
			},
		})

		stateRouter.go(`state1`, {}) // redirects
	})
})

test(`default parameters should work for route params too`, async t => {
	async function testWithPropertyName(property) {
		await t.test(property, async tt => {
			const state = getTestState(tt)
			const stateRouter = state.stateRouter

			const asrState = {
				name: `state1`,
				route: `/state1/:yarp`,
				template: {},
				querystringParameters: [ `wat` ],
				activate(context) {
					assert.deepStrictEqual({ wat: `lol`, yarp: `neat` }, context.parameters)
					assert.strictEqual(state.location.get(), `/state1/neat?wat=lol`)
				},
			}

			asrState[property] = { wat: `lol`, yarp: `neat` }

			stateRouter.addState(asrState)

			await new Promise(resolve => {
				stateRouter.once('stateChangeEnd', () => {
					resolve()
				})
				stateRouter.go(`state1`, {})
			})
		})
	}

	await testWithPropertyName(`defaultParameters`)
})

test(`default parameters should work for default child route params`, async t => {
	async function testWithPropertyName(property) {
		await t.test(property, async tt => {
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
					assert.deepStrictEqual({ wat: `lol`, yarp: `neat` }, context.parameters)
					assert.strictEqual(state.location.get(), `/state1/neat?wat=lol`)
				},
			}

			asrState[property] = { wat: `lol`, yarp: `neat` }

			stateRouter.addState(asrState)

			await new Promise(resolve => {
				stateRouter.once('stateChangeEnd', () => {
					resolve()
				})
				stateRouter.go(`state1`, {})
			})
		})
	}

	await testWithPropertyName(`defaultParameters`)
})

test(`default parameters on parent states should apply to child state routes`, async t => {
	async function testWithPropertyName(property) {
		await t.test(property, async tt => {
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
					assert.deepStrictEqual({ wat: `lol`, yarp: `neat` }, context.parameters)
					assert.strictEqual(state.location.get(), `/state1/neat?wat=lol`)
				},
			})

			await new Promise(resolve => {
				stateRouter.once('stateChangeEnd', () => {
					resolve()
				})
				stateRouter.go(`state1`, {})
			})
		})
	}

	await testWithPropertyName(`defaultParameters`)
})

test(`empty string is a valid default parameter`, async t => {
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
			assert.strictEqual(context.parameters.someParam, ``)
			assert.strictEqual(state.location.get(), `/state?someParam=`)
		},
	})

	await new Promise(resolve => {
		stateRouter.once('stateChangeEnd', () => {
			resolve()
		})
		stateRouter.go(`state`)
	})
})

test(`function is a valid default parameter which returns the default value`, async t => {
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
			assert.strictEqual(context.parameters.someParam, `foo`)
			assert.strictEqual(context.parameters.someOtherParam, `barbaz`)
			assert.strictEqual(state.location.get(), `/state?someOtherParam=barbaz&someParam=foo`)
		},
	})

	await new Promise(resolve => {
		stateRouter.once('stateChangeEnd', () => {
			resolve()
		})
		stateRouter.go(`state`)
	})
})

test(`default parameters should be present in the parent's resolve fn when not given and resolving a child state`, async t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter

	await new Promise(resolve => {
		const parentState = {
			name: `state1`,
			route: `/state1`,
			template: {},
			querystringParameters: [ `wat`, `yarp`, 'somethingElse' ],
			defaultParameters: {
				wat: 'lol',
				yarp: 'neat',
			},
			resolve(_data, parameters) {
				assert.strictEqual(parameters.wat, 'lol')
				assert.strictEqual(parameters.yarp, 'neat')
				resolve()
			},
		}

		stateRouter.addState(parentState)
		stateRouter.addState({
			name: `state1.child1`,
			route: `/child1`,
			template: {},
			querystringParameters: [ `somethingElse` ],
		})

		stateRouter.go(`state1.child1`, { somethingElse: 'else' })
	})
})
