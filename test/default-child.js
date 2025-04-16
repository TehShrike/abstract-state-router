import { test } from 'node:test'
import assert from 'node:assert'
import getTestState from './helpers/test-state-factory.js'

function resolve(data, parameters) {
	return new Promise(resolve => setTimeout(resolve, 5, null))
}

function RememberActivation(location) {
	let lastActivatedState = ``
	let lastLocation = ``
	function activate(stateName) {
		return function stateActivated() {
			lastActivatedState = stateName
			lastLocation = location.get()
		}
	}
	function onEnd(t, stateName, expectedUrl) {
		return function assertions() {
			assert.strictEqual(lastActivatedState, stateName, `last activated state should be "${ stateName }"`)
			assert.strictEqual(lastLocation, expectedUrl, `last observed url should be "${ lastLocation }"`)
			return Promise.resolve()
		}
	}
	return {
		activate,
		onEnd,
	}
}

test(`default grandchild`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	const remember = RememberActivation(testState.location)

	stateRouter.addState({
		name: `hey`,
		route: `/hay`,
		defaultChild: `rofl`,
		template: {},
		resolve,
		activate: remember.activate(`hey`),
	})

	stateRouter.addState({
		name: `hey.rofl`,
		route: `/routeButt`,
		defaultChild: `copter`,
		template: {},
		resolve,
		querystringParameters: [ `wat` ],
		activate: remember.activate(`rofl`),
	})

	stateRouter.addState({
		name: `hey.rofl.copter`,
		route: `/lolcopter`,
		template: {},
		resolve,
		activate: remember.activate(`copter`),
	})

	stateRouter.addState({
		name: `hey.rofl.cat`,
		route: `/lolcat`,
		template: {},
		resolve,
		activate: remember.activate(`cat`),
	})

	await t.test(`hey -> hey.rofl.copter`, async tt => {
		await new Promise(resolve => {
			stateRouter.once(`stateChangeEnd`, () => {
				remember.onEnd(tt, `copter`, `/hay/routeButt/lolcopter`)()
				resolve()
			})
			stateRouter.go(`hey`)
		})
	})

	await t.test(`hey.rofl -> hey.rofl.copter`, async tt => {
		await new Promise(resolve => {
			stateRouter.once(`stateChangeEnd`, () => {
				remember.onEnd(tt, `copter`, `/hay/routeButt/lolcopter`)()
				resolve()
			})
			stateRouter.go(`hey.rofl`)
		})
	})

	await t.test(`hey.rofl.cat -> hey.rofl.cat`, async tt => {
		await new Promise(resolve => {
			stateRouter.once(`stateChangeEnd`, () => {
				remember.onEnd(tt, `cat`, `/hay/routeButt/lolcat`)()
				resolve()
			})
			stateRouter.go(`hey.rofl.cat`)
		})
	})
})

test(`bad defaults`, async t => {
	const stateRouter = getTestState(t).stateRouter

	stateRouter.addState({
		name: `hey`,
		route: `/hay`,
		defaultChild: `nonexistent`,
		template: {},
		resolve,
		activate() {
			assert.fail(`Should not activate`)
		},
	})

	await new Promise(resolve => {
		stateRouter.on(`stateError`, e => {
			assert.ok(true, `Defaulting to a nonexistent state should cause an error to be emitted`)
			assert.notEqual(e.message.indexOf(`nonexistent`), -1, `the invalid state name is in the error message`)
			resolve()
		})

		stateRouter.go(`hey`)
	})
})

test(`functions as parameters`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	const remember = RememberActivation(testState.location)

	stateRouter.addState({
		name: `hey`,
		route: `/hay`,
		defaultChild() {
			return `rofl`
		},
		template: {},
		resolve,
		activate: remember.activate(`hey`),
	})

	stateRouter.addState({
		name: `hey.rofl`,
		route: `/routeButt`,
		template: {},
		resolve,
		querystringParameters: [ `wat` ],
		activate: remember.activate(`rofl`),
	})

	await t.test(`hey -> hey`, async tt => {
		await new Promise(resolve => {
			stateRouter.once(`stateChangeEnd`, () => {
				remember.onEnd(tt, `rofl`, `/hay/routeButt`)()
				resolve()
			})
			stateRouter.go(`hey`)
		})
	})
})

test(`the default child should activate even if it has an empty route string`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	const remember = RememberActivation(testState.location)

	stateRouter.addState({
		name: `hey`,
		route: `/hay`,
		defaultChild: `rofl`,
		template: {},
		activate: remember.activate(`hey`),
	})

	stateRouter.addState({
		name: `hey.wrong1`,
		template: {},
		activate: remember.activate(`wrong1`),
	})

	stateRouter.addState({
		name: `hey.rofl`,
		route: ``,
		template: {},
		activate: remember.activate(`rofl`),
	})

	stateRouter.addState({
		name: `hey.wrong2`,
		template: {},
		activate: remember.activate(`wrong2`),
	})

	await t.test(`hey -> hey`, async tt => {
		await new Promise(resolve => {
			stateRouter.once(`stateChangeEnd`, () => {
				remember.onEnd(tt, `rofl`, `/hay/`)()
				resolve()
			})
			stateRouter.go(`hey`)
		})
	})
})

test(`the default child should activate even if it doesn't have a route string`, async t => {
	function setupState(tt, roflRoute) {
		const testState = getTestState(tt)
		const stateRouter = testState.stateRouter
		const remember = RememberActivation(testState.location)
		testState.remember = remember

		stateRouter.addState({
			name: `hey`,
			route: `/hay`,
			defaultChild: `rofl`,
			template: {},
			activate: remember.activate(`hey`),
		})

		stateRouter.addState({
			name: `hey.wrong1`,
			template: {},
			activate: remember.activate(`wrong1`),
		})

		stateRouter.addState({
			name: `hey.rofl`,
			template: {},
			route: roflRoute,
			activate: remember.activate(`rofl`),
		})

		stateRouter.addState({
			name: `hey.wrong2`,
			template: {},
			activate: remember.activate(`wrong2`),
		})

		return testState
	}

	await t.test(`undefined child route with state.go(hey)`, async tt => {
		const testState = setupState(tt)
		await new Promise(resolve => {
			testState.stateRouter.once(`stateChangeEnd`, () => {
				testState.remember.onEnd(tt, `rofl`, `/hay/`)()
				resolve()
			})
			testState.stateRouter.go(`hey`)
		})
	})

	await t.test(`undefined child route with location.go(/hay)`, async tt => {
		const testState = setupState(tt)
		await new Promise(resolve => {
			testState.stateRouter.once(`stateChangeEnd`, () => {
				testState.remember.onEnd(tt, `rofl`, `/hay/`)()
				resolve()
			})
			testState.location.go(`/hay`)
		})
	})

	await t.test(`undefined child route with location.go(/hay/)`, async tt => {
		const testState = setupState(tt)
		await new Promise(resolve => {
			testState.stateRouter.once(`stateChangeEnd`, () => {
				testState.remember.onEnd(tt, `rofl`, `/hay/`)()
				resolve()
			})
			testState.location.go(`/hay/`)
		})
	})

	await t.test(`empty child route with state.go(hey)`, async tt => {
		const testState = setupState(tt, ``)
		await new Promise(resolve => {
			testState.stateRouter.once(`stateChangeEnd`, () => {
				testState.remember.onEnd(tt, `rofl`, `/hay/`)()
				resolve()
			})
			testState.stateRouter.go(`hey`)
		})
	})

	await t.test(`empty child route with location.go(/hay)`, async tt => {
		const testState = setupState(tt, ``)
		await new Promise(resolve => {
			testState.stateRouter.once(`stateChangeEnd`, () => {
				testState.remember.onEnd(tt, `rofl`, `/hay/`)()
				resolve()
			})
			testState.location.go(`/hay`)
		})
	})

	await t.test(`empty child route with location.go(/hay/)`, async tt => {
		const testState = setupState(tt, ``)
		await new Promise(resolve => {
			testState.stateRouter.once(`stateChangeEnd`, () => {
				testState.remember.onEnd(tt, `rofl`, `/hay/`)()
				resolve()
			})
			testState.location.go(`/hay/`)
		})
	})
})
