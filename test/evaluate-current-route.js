import { test } from 'node:test'
import assert from 'node:assert'
import getTestState from './helpers/test-state-factory.js'

test(`evaluateCurrentRoute with url set`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	const hashRouter = testState.hashRouter

	let correctRouteCalled = false

	hashRouter.go(`/theUrlWhenThePageIsFirstOpened`)

	stateRouter.addState({
		name: `whatever`,
		route: `/ignored`,
		template: null,
		activate() {
			assert.fail()
		},
	})

	await new Promise(resolve => {
		stateRouter.addState({
			name: `correct`,
			route: `/theUrlWhenThePageIsFirstOpened`,
			template: null,
			activate(context) {
				assert.ok(!correctRouteCalled)
				correctRouteCalled = true
				assert.ok(!context.parameters.parameterName)
				resolve()
			},
		})

		assert.ok(!correctRouteCalled)

		stateRouter.evaluateCurrentRoute(`whatever`, { parameterName: `wrong` })
	})
})

test(`evaluateCurrentRoute with slash url`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	const hashRouter = testState.hashRouter

	let correctRouteCalled = false

	hashRouter.go(`/`)

	await new Promise(resolve => {
		stateRouter.addState({
			name: `correct`,
			route: `/`,
			template: null,
			activate(context) {
				assert.ok(!correctRouteCalled)
				correctRouteCalled = true
				assert.ok(!context.parameters.parameterName)
				resolve()
			},
		})

		assert.ok(!correctRouteCalled)

		stateRouter.evaluateCurrentRoute(`correct`)
	})
})

test(`evaluateCurrentRoute with no current route should go to the default`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter

	let correctRouteCalled = false

	stateRouter.addState({
		name: `whatever`,
		route: `/ignored`,
		template: null,
		activate() {
			assert.fail()
		},
	})

	await new Promise(resolve => {
		stateRouter.addState({
			name: `correct`,
			route: `/default`,
			template: null,
			activate(context) {
				assert.ok(!correctRouteCalled)

				assert.strictEqual(context.parameters.parameterName, `wrong`)
				correctRouteCalled = true
				resolve()
			},
		})

		assert.ok(!correctRouteCalled)

		stateRouter.evaluateCurrentRoute(`correct`, { parameterName: `wrong` })
	})
})
