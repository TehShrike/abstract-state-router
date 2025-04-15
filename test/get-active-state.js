import { test } from 'node:test'
import assert from 'node:assert'
import getTestState from './helpers/test-state-factory.js'

test(`getActiveState with no parameters`, async t => {
	const stateRouter = getTestState(t).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent`,
	})

	stateRouter.addState({
		name: `parent.child`,
		template: ``,
		route: `/child`,
	})

	stateRouter.addState({
		name: `parent.child.grandchild`,
		template: ``,
		route: `/grandchild`,
	})

	await new Promise(resolve => {
		stateRouter.on(`stateChangeEnd`, () => {
			assert.deepStrictEqual(stateRouter.getActiveState(), {
				name: `parent.child`,
				parameters: {},
			})

			resolve()
		})

		stateRouter.go(`parent.child`)
	})
})

test(`getActiveState returns parameters`, async t => {
	const stateRouter = getTestState(t).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent`,
	})

	stateRouter.addState({
		name: `parent.child`,
		template: ``,
		route: `/child`,
	})

	await new Promise(resolve => {
		stateRouter.on(`stateChangeEnd`, () => {
			assert.strictEqual(stateRouter.getActiveState().parameters.butts, `yes`)

			resolve()
		})

		stateRouter.go(`parent.child`, { butts: `yes` })
	})
})
