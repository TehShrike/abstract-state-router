import { test } from 'node:test'
import assert from 'node:assert'
import assertingRendererFactory from './helpers/asserting-renderer-factory.js'
import getTestState from './helpers/test-state-factory.js'

test(`moving from x.y.z to x destroys z then y`, async t => {
	function basicTest(t) {
		const grandparentTemplate = {}
		const parentTemplate = {}
		const childTemplate = {}

		const renderer = assertingRendererFactory(t, [ grandparentTemplate, parentTemplate, childTemplate ])
		const state = getTestState(t, renderer)
		const stateRouter = state.stateRouter

		let childDestroyed = false
		let parentDestroyed = false

		stateRouter.addState({
			name: `hey`,
			route: `/hay`,
			template: grandparentTemplate,
			resolve(data, parameters) {
				return new Promise(resolve => setTimeout(resolve, 0))
			},
			activate(context) {
				context.on(`destroy`, () => {
					assert.fail(`grandparent should not be destroyed`)
				})
			},
		})

		stateRouter.addState({
			name: `hey.rofl`,
			route: `/routeButt`,
			template: parentTemplate,
			resolve(data, parameters) {
				return new Promise(resolve => setTimeout(resolve, 10))
			},
			querystringParameters: [ `wat` ],
			activate(context) {
				context.on(`destroy`, () => {
					parentDestroyed = true
					assert.ok(childDestroyed, `parent gets destroyed after child`)
				})
			},
		})

		stateRouter.addState({
			name: `hey.rofl.copter`,
			route: `/lolcopter`,
			template: childTemplate,
			resolve(data, parameters) {
				return new Promise(resolve => setTimeout(resolve, 0))
			},
			activate(context) {
				context.on(`destroy`, () => {
					assert.strictEqual(parentDestroyed, false, `child gets destroyed before parent`)
					childDestroyed = true
				})
			},
		})

		return state
	}

	await t.test(`triggered with go()`, async t => {
		const stateRouter = basicTest(t).stateRouter

		await new Promise(resolve => {
			stateRouter.go(`hey.rofl.copter`, { wat: `wut` })
			stateRouter.once(`stateChangeEnd`, () => {
				stateRouter.go(`hey`)
				stateRouter.once(`stateChangeEnd`, () => {
					resolve()
				})
			})
		})
	})

	await t.test(`triggered by the router`, async t => {
		const testState = basicTest(t)
		const hashRouter = testState.hashRouter

		await new Promise(resolve => {
			hashRouter.go(`/hay/routeButt/lolcopter?wat=wut`)
			testState.stateRouter.once(`stateChangeEnd`, () => {
				hashRouter.go(`/hay`)
				testState.stateRouter.once(`stateChangeEnd`, () => {
					resolve()
				})
			})
		})
	})
})

test(`a state with changing querystring gets destroyed`, async t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter
	let parentResolveCalled = 0
	let parentActivated = 0
	let parentDestroyed = 0
	let child1Destroyed = 0

	stateRouter.addState({
		name: `parent`,
		route: `/parent`,
		template: null,
		querystringParameters: [ `aParam` ],
		resolve(data, parameters) {
			return new Promise(resolve => {
				parentResolveCalled++
				if (parentResolveCalled === 2) {
					assert.strictEqual(parameters.aParam, `3`, `parameter was set correctly in second resolve`)
				}

				resolve({})
			})
		},
		activate(context) {
			parentActivated++
			context.on(`destroy`, () => {
				parentDestroyed++
			})
		},
	})

	stateRouter.addState({
		name: `parent.child1`,
		route: `/child1`,
		template: null,
		activate(context) {
			context.on(`destroy`, () => {
				child1Destroyed++
			})

			stateRouter.go(`parent.child2`, {
				aParam: `3`,
			})
		},
	})

	await new Promise(resolve => {
		stateRouter.addState({
			name: `parent.child2`,
			route: `/child2`,
			template: null,
			activate(context) {
				assert.strictEqual(parentResolveCalled, 2, `parent resolve called twice`)
				assert.strictEqual(parentActivated, 2, `parent activated twice`)
				assert.strictEqual(child1Destroyed, 1, `child1 destroyed once`)
				assert.strictEqual(parentDestroyed, 1, `parent destroyed once`)
				resolve()
			},
		})

		stateRouter.go(`parent.child1`)
	})
})

test(`When navigating to the same state as before, make sure the data from the child's resolve gets passed along`, async t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter

	let activations = 0

	await new Promise(resolve => {
		stateRouter.addState({
			name: `parent`,
			route: `/parent`,
			template: null,
			querystringParameters: [ `aParam` ],
			// eslint-disable-next-line require-await
			async resolve() {
				return {
					legit: true,
				}
			},
			activate({ content }) {
				activations++

				assert.strictEqual(content.legit, true)

				if (activations === 2) {
					resolve()
				} else {
					stateRouter.go(`parent`, { aParam: `something different` })
				}
			},
		})

		stateRouter.go(`parent`)
	})
})
