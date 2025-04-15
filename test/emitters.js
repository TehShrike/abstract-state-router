import { test } from 'node:test'
import assert from 'node:assert'
import assertingRendererFactory from './helpers/asserting-renderer-factory.js'
import getTestState from './helpers/test-state-factory.js'

test(`Emitting errors when attempting to navigate to invalid states`, async t => {
	async function testGoingTo(description, invalidStateName) {
		await t.test(description, async t => {
			const renderer = assertingRendererFactory(t, [])
			const state = getTestState(t, renderer)
			const stateRouter = state.stateRouter

			stateRouter.addState({
				name: `valid`,
				route: `/valid`,
				template: null,
				activate(context) {
					assert.fail(`Should never activate the parent's state`)
				},
			})

			stateRouter.addState({
				name: `valid.valid`,
				route: `/valid`,
				template: null,
				activate(context) {
					assert.fail(`Should never activate the child's state`)
				},
			})

			await new Promise(resolve => {
				stateRouter.on(`stateChangeError`, e => {
					assert.notEqual(e.message.indexOf(invalidStateName), -1, `invalid state name is in the error message`)
					resolve()
				})

				stateRouter.go(invalidStateName, {})
			})
		})
	}

	await testGoingTo(`All states invalid`, `invalid.also-invalid`)
	await testGoingTo(`Only the child state invalid`, `valid.invalid`)
})

test(`Emitting stateChangeStart and stateChangeEnd`, async t => {
	const parent1Template = {}
	const child1Template = {}
	const parent2Template = {}
	const child2Template = {}
	const firstProperties = { one: `wat` }
	const secondProperties = { two: `wat` }
	const renderer = assertingRendererFactory(t, [ parent1Template, child1Template, parent2Template, child2Template ])
	const state = getTestState(t, renderer)
	const stateRouter = state.stateRouter

	let firstParentActivate = false
	let firstChildActivate = false
	let secondParentActivate = false
	let secondChildActivate = false

	const valid1 = {
		name: `valid1`,
		route: `/valid1`,
		template: parent1Template,
		activate(context) {
			firstParentActivate = true
		},
	}
	const valid1valid = {
		name: `valid1.valid`,
		route: `/valid1`,
		template: child1Template,
		activate(context) {
			firstChildActivate = true
		},
	}

	const valid2 = {
		name: `valid2`,
		route: `/valid2`,
		template: parent2Template,
		activate(context) {
			secondParentActivate = true
		},
	}

	const valid2valid = {
		name: `valid2.valid`,
		route: `/valid2`,
		template: child2Template,
		activate(context) {
			secondChildActivate = true
		},
	}

	stateRouter.addState(valid1)
	stateRouter.addState(valid1valid)
	stateRouter.addState(valid2)
	stateRouter.addState(valid2valid)

	await new Promise(resolve => {
		stateRouter.once(`stateChangeStart`, (state, properties, states) => {
			assert.strictEqual(state.name, `valid1.valid`)
			assert.deepStrictEqual(properties, firstProperties)
			assert.strictEqual(firstParentActivate, false)
			assert.strictEqual(firstChildActivate, false)
			assert.strictEqual(secondParentActivate, false)
			assert.strictEqual(secondChildActivate, false)

			assert.deepStrictEqual(states, [ valid1, valid1valid ])
		})

		stateRouter.once(`stateChangeEnd`, (state, properties, states) => {
			assert.strictEqual(state.name, `valid1.valid`)
			assert.deepStrictEqual(properties, firstProperties)
			assert.strictEqual(firstParentActivate, true)
			assert.strictEqual(firstChildActivate, true)
			assert.strictEqual(secondParentActivate, false)
			assert.strictEqual(secondChildActivate, false)

			assert.deepStrictEqual(states, [ valid1, valid1valid ])

			stateRouter.once(`stateChangeStart`, (state, properties, states) => {
				assert.strictEqual(state.name, `valid2.valid`)
				assert.deepStrictEqual(properties, secondProperties)
				assert.strictEqual(firstParentActivate, true)
				assert.strictEqual(firstChildActivate, true)
				assert.strictEqual(secondParentActivate, false)
				assert.strictEqual(secondChildActivate, false)

				assert.deepStrictEqual(states, [ valid2, valid2valid ])
			})

			stateRouter.once(`stateChangeEnd`, (state, properties, states) => {
				assert.strictEqual(state.name, `valid2.valid`)
				assert.deepStrictEqual(properties, secondProperties)
				assert.strictEqual(firstParentActivate, true)
				assert.strictEqual(firstChildActivate, true)
				assert.strictEqual(secondParentActivate, true)
				assert.strictEqual(secondChildActivate, true)

				assert.deepStrictEqual(states, [ valid2, valid2valid ])

				resolve()
			})

			stateRouter.go(`valid2.valid`, secondProperties)
		})

		stateRouter.go(`valid1.valid`, firstProperties)
	})
})

test(`emitting stateChangeError`, async t => {
	const parent1Template = {}
	const child1Template = {}
	const renderer = assertingRendererFactory(t, [ ])
	const state = getTestState(t, renderer)
	const stateRouter = state.stateRouter
	const error1 = new Error(`first`)
	const error2 = new Error(`second`)

	stateRouter.addState({
		name: `valid1`,
		route: `/valid1`,
		template: parent1Template,
		resolve() {
			throw error1
		},
		activate(context) {
			assert.fail(`should not activate`)
		},
	})

	stateRouter.addState({
		name: `valid1.valid`,
		route: `/valid1`,
		template: child1Template,
		resolve() {
			throw error2
		},
		activate(context) {
			assert.fail(`should not activate`)
		},
	})

	await new Promise(resolve => {
		stateRouter.on(`stateChangeError`, e => {
			assert.strictEqual(e, error1)
			resolve()
		})

		stateRouter.go(`valid1.valid`)
	})
})

test(`emitting dom api create`, async t => {
	const originalDomApi = {}
	let renderCalled = false
	let beforeEventFired = false
	let afterEventFired = false

	const state = getTestState(t, () => ({
		render(context) {
			assert.ok(beforeEventFired)
			renderCalled = true
			assert.strictEqual(afterEventFired, false)
			return Promise.resolve(originalDomApi)
		},
		reset() {
			assert.fail(`Reset should not be called`)
			return Promise.resolve()
		},
		destroy(renderedTemplateApi) {
			return Promise.resolve()
		},
		getChildElement: function getChildElement(renderedTemplateApi) {
			return Promise.resolve({})
		},
	}))

	const stateRouter = state.stateRouter

	const originalStateObject = {
		name: `state`,
		route: `/state`,
		template: {},
		querystringParameters: [ `wat`, `much` ],
		defaultQuerystringParameters: { wat: `lol`, much: `neat` },
		resolve(data, params) {
			return Promise.resolve({
				value: `legit`,
			})
		},
	}

	stateRouter.addState(originalStateObject)

	await new Promise(resolve => {
		stateRouter.on(`beforeCreateState`, context => {
			assert.strictEqual(renderCalled, false)
			assert.strictEqual(afterEventFired, false)
			assert.strictEqual(beforeEventFired, false)
			beforeEventFired = true

			assert.strictEqual(context.state, originalStateObject)
			assert.strictEqual(context.content.value, `legit`)
			assert.strictEqual(context.parameters.thingy, `yes`)
			assert.strictEqual(context.domApi, undefined)
		})

		stateRouter.on(`afterCreateState`, context => {
			assert.ok(beforeEventFired)
			assert.ok(renderCalled)
			assert.strictEqual(afterEventFired, false)
			afterEventFired = true

			assert.strictEqual(context.state, originalStateObject)
			assert.strictEqual(context.content.value, `legit`)
			assert.strictEqual(context.parameters.thingy, `yes`)
			assert.strictEqual(context.domApi, originalDomApi)

			resolve()
		})

		stateRouter.go(`state`, {
			thingy: `yes`,
		})
	})
})

test(`emitting dom api destroy`, async t => {
	const originalDomApi = {}
	let beforeEventFired = false
	let afterEventFired = false
	let destroyCalled = false

	const state = getTestState(t, () => ({
		render(context) {
			return Promise.resolve(originalDomApi)
		},
		reset() {
			assert.fail(`Reset should not be called`)
			return Promise.resolve()
		},
		destroy(renderedTemplateApi) {
			assert.ok(beforeEventFired)
			assert.strictEqual(afterEventFired, false)
			destroyCalled = true

			return Promise.resolve()
		},
		getChildElement: function getChildElement(renderedTemplateApi) {
			return Promise.resolve({})
		},
	}))

	const stateRouter = state.stateRouter

	const originalStateObject = {
		name: `state`,
		route: `/state`,
		template: {},
		activate() {
			stateRouter.go(`second-state`, {})
		},
	}

	stateRouter.addState(originalStateObject)

	await new Promise(resolve => {
		stateRouter.addState({
			name: `second-state`,
			route: `/second`,
			template: {},
			activate(context) {
				assert.ok(afterEventFired)
				resolve()
			},
		})

		stateRouter.on(`beforeDestroyState`, context => {
			assert.strictEqual(destroyCalled, false)
			assert.strictEqual(afterEventFired, false)
			beforeEventFired = true

			assert.strictEqual(context.state, originalStateObject)
			assert.strictEqual(context.domApi, originalDomApi)
		})

		stateRouter.on(`afterDestroyState`, context => {
			assert.ok(beforeEventFired)
			assert.ok(destroyCalled)
			afterEventFired = true

			assert.strictEqual(context.state, originalStateObject)
			assert.strictEqual(context.domApi, undefined)
		})

		stateRouter.go(`state`, {})
	})
})

test(`emitting routeNotFound`, async t => {
	const renderer = assertingRendererFactory(t, [])
	const state = getTestState(t, renderer)
	const stateRouter = state.stateRouter

	stateRouter.addState({
		name: `valid`,
		route: `/valid`,
		template: null,
		activate(context) {
			assert.fail(`Should never activate the parent's state`)
		},
	})

	stateRouter.addState({
		name: `valid.valid`,
		route: `/valid`,
		template: null,
		activate(context) {
			assert.fail(`Should never activate the child's state`)
		},
	})

	stateRouter.on(`stateChangeError`, e => {
		assert.fail(`Should not emit a normal error`)
	})

	stateRouter.on(`stateError`, e => {
		assert.fail(`Should not emit a normal error`)
	})

	await new Promise(resolve => {
		stateRouter.on(`routeNotFound`, (route, parameters) => {
			assert.strictEqual(route, `/nonexistent`)
			assert.strictEqual(parameters.thingy, `stuff`)
			resolve()
		})

		state.hashRouter.location.go(`/nonexistent?thingy=stuff`)
	})
})
