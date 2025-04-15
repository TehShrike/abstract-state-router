import { test } from 'node:test'
import assert from 'node:assert'
import getTestState from './helpers/test-state-factory.js'

test(`test redirecting activating the correct states`, async t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter

		let parentActivated = false
		let cancelEvents = 0

		stateRouter.addState({
			name: `valid`,
			route: `/valid`,
			template: {},
			resolve(data, params) {
				return new Promise(resolve => setTimeout(resolve, 50))
			},
			activate() {
				assert.ok(!parentActivated, `The parent should only activate once`)
				parentActivated = true
			},
		})

		stateRouter.addState({
			name: `valid.valid1`,
			route: `/valid1`,
			template: {},
			resolve(data, params) {
				return new Promise((_resolve, reject) => setTimeout(reject, 100, { redirectTo: { name: `valid.valid2` } }))
			},
			activate() {
				assert.fail(`should not activate`)
			},
		})

		stateRouter.addState({
			name: `valid.valid2`,
			route: `/valid2`,
			template: {},
			resolve(data, params) {
				return new Promise((_resolve, reject) => setTimeout(reject, 100, { redirectTo: { name: `valid.valid3` } }))
			},
			activate() {
				assert.fail(`should not activate`)
			},
		})

		stateRouter.addState({
			name: `valid.valid3`,
			route: `/valid3`,
			template: {},
			resolve(data, params) {
				return new Promise(resolve => setTimeout(resolve, 100))
			},
			activate() {
				assert.ok(true, `valid.valid3 activated`)
				assert.strictEqual(cancelEvents, 2, `Two cancel events emitted`)
			},
		})

		stateRouter.on(`stateChangeCancelled`, e => {
			cancelEvents++
		})

		return state
	}

	await t.test(`with state.go`, async t => {
		const state = startTest(t)
		const stateRouter = state.stateRouter

		await new Promise(resolve => {
			stateRouter.once('stateChangeEnd', () => {
				resolve()
			})

			stateRouter.go(`valid.valid1`)
		})
	})

	await t.test(`by changing the url`, async t => {
		const state = startTest(t)
		const hashRouter = state.hashRouter

		await new Promise(resolve => {
			state.stateRouter.once('stateChangeEnd', () => {
				resolve()
			})

			hashRouter.go(`/valid/valid1`)
		})
	})
})

test(`only one cancel happens if multiple redirects are called`, async t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter

		let cancelEvents = 0

		stateRouter.addState({
			name: `valid`,
			route: `/valid`,
			template: {},
			resolve(data, params) {
				return new Promise(resolve => setTimeout(resolve, 50))
			},
			activate() {},
		})

		stateRouter.addState({
			name: `valid.valid1`,
			route: `/valid1`,
			template: {},
			resolve(data, params) {
				return new Promise((resolve, reject) => {
					reject({ redirectTo: { name: `valid.valid3` } })
					reject({ redirectTo: { name: `valid.valid2` } })
				})
			},
			activate() {
				assert.fail(`should not activate`)
			},
		})

		stateRouter.addState({
			name: `valid.valid2`,
			route: `/valid2`,
			template: {},
			activate() {
				assert.fail(`should not activate`)
			},
		})

		stateRouter.addState({
			name: `valid.valid3`,
			route: `/valid3`,
			template: {},
			resolve(data, params) {
				return new Promise(resolve => setTimeout(resolve, 100))
			},
			activate() {
				assert.ok(true, `valid.valid3 activated`)
				assert.strictEqual(cancelEvents, 1, `One cancel event emitted`)
			},
		})

		stateRouter.on(`stateChangeCancelled`, e => {
			cancelEvents++
		})

		return state
	}

	await t.test(`with state.go`, async t => {
		const state = startTest(t)
		const stateRouter = state.stateRouter

		await new Promise(resolve => {
			stateRouter.once('stateChangeEnd', () => {
				resolve()
			})

			stateRouter.go(`valid.valid1`)
		})
	})

	await t.test(`by changing the url`, async t => {
		const state = startTest(t)
		const hashRouter = state.hashRouter

		await new Promise(resolve => {
			state.stateRouter.once('stateChangeEnd', () => {
				resolve()
			})

			hashRouter.go(`/valid/valid1`)
		})
	})
})
