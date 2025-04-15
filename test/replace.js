import { test } from 'node:test'
import assert from 'node:assert'
import assertingRendererFactory from './helpers/asserting-renderer-factory.js'
import getTestState from './helpers/test-state-factory.js'

test(`a normal replace call against the state router itself`, async t => {
	const parent1Template = {}
	const child1Template = {}
	const child2Template = {}
	const renderer = assertingRendererFactory(t, [ parent1Template, child1Template, child2Template ])
	const state = getTestState(t, renderer)
	const stateRouter = state.stateRouter

	let parentActivated = false
	let child1Activated = false
	let child2Activated = false

	stateRouter.addState({
		name: `valid1`,
		route: `/valid1`,
		template: parent1Template,
		activate(context) {
			assert.strictEqual(parentActivated, false, `parent activated once`)
			parentActivated = true
		},
	})

	stateRouter.addState({
		name: `valid1.valid`,
		route: `/valid1`,
		template: child1Template,
		activate(context) {
			assert.strictEqual(child1Activated, false, `child1 activated once`)
			child1Activated = true

			setTimeout(() => {
				stateRouter.go(`valid1.valid2`, {}, { replace: true })
			}, 10)
		},
	})

	//await new Promise(resolve => {
	stateRouter.addState({
		name: `valid1.valid2`,
		route: `/valid2`,
		template: child2Template,
		activate(context) {
			assert.strictEqual(child2Activated, false, `child2 activated once`)
			child2Activated = true

			assert.strictEqual(state.location.get(), `/valid1/valid2`)
			resolve()
		},
	})

	stateRouter.go(`valid1.valid`)
	//})
})
