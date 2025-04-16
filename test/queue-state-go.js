import { test } from 'node:test'
import assert from 'node:assert'
import getTestState from './helpers/test-state-factory.js'

test(`test queue with a basic activate-in-order test`, async t => {
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
				return new Promise(resolve => setTimeout(resolve, 100))
			},
			activate() {
				assert.ok(!parentActivated, `Should only activate once`)
				parentActivated = true
			},
		})

		stateRouter.addState({
			name: `valid.valid1`,
			route: `/valid1`,
			template: {},
			resolve(data, params) {
				return new Promise(resolve => setTimeout(resolve, 100))
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
				assert.strictEqual(cancelEvents, 2, `Two cancel events emitted`)
			},
		})

		stateRouter.on(`stateChangeCancelled`, e => {
			cancelEvents++
		})

		return state
	}

	await t.test(`with state.go`, async t => {
		const stateRouter = (await startTest(t)).stateRouter

		await new Promise(resolve => {
			stateRouter.once('stateChangeEnd', () => {
				resolve()
			})

			stateRouter.go(`valid.valid1`)
			stateRouter.go(`valid.valid2`)
			stateRouter.go(`valid.valid3`)
		})
	})

	await t.test(`by changing the url`, async t => {
		const state = startTest(t)
		const stateRouter = state.stateRouter
		const hashRouter = state.hashRouter

		await new Promise(resolve => {
			state.stateRouter.once('stateChangeEnd', () => {
				resolve()
			})

			hashRouter.go(`/valid/valid1`)
			hashRouter.go(`/valid/valid2`)
			hashRouter.go(`/valid/valid3`)
		})
	})
})

test(`test queue a state.go happening during a render`, async t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter

	let parentActivated = false

	stateRouter.addState({
		name: `valid`,
		route: `/valid`,
		template: {},
		resolve(data, params) {
			return new Promise(resolve => setTimeout(resolve, 100))
		},
		activate() {
			assert.ok(!parentActivated, `Should only activate once`)
			parentActivated = true
		},
	})

	stateRouter.addState({
		name: `valid.valid1`,
		route: `/valid1`,
		template: {},
		resolve(data, params) {
			assert.ok(true, `valid.valid1 resolve called`)
			return new Promise(resolve => {
				setTimeout(resolve, 100)
				process.nextTick(() => {
					stateRouter.go(`valid.valid2`)
				})
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
		resolve(data, params) {
			return new Promise(resolve => setTimeout(resolve, 100))
		},
		activate() {
			assert.ok(true, `valid.valid2 activated`)
		},
	})

	await new Promise(resolve => {
		stateRouter.once('stateChangeEnd', () => {
			resolve()
		})

		stateRouter.go(`valid.valid1`)
	})
})

test(`test queue a state.go when the last transition is in the middle of activating`, async t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter

	let firstTimeParentHasBeenActivated = true
	let valid2Activated = false
	let valid1Activated = false

	stateRouter.addState({
		name: `valid`,
		route: `/valid`,
		template: {},
		resolve(data, params) {
			return new Promise(resolve => setTimeout(resolve, 100))
		},
		activate() {
			if (firstTimeParentHasBeenActivated) {
				stateRouter.go(`valid.valid2`)
				firstTimeParentHasBeenActivated = false
			}
		},
	})

	stateRouter.addState({
		name: `valid.valid1`,
		route: `/valid1`,
		template: {},
		resolve(data, params) {
			assert.ok(true, `valid.valid1 resolve called`)
			return new Promise(resolve => setTimeout(resolve, 100))
		},
		activate() {
			valid1Activated = true
			assert.ok(!valid2Activated, `valid2 should not be activated yet`)
			assert.ok(true, `valid.valid1 should activate`)
		},
	})

	stateRouter.addState({
		name: `valid.valid2`,
		route: `/valid2`,
		template: {},
		resolve(data, params) {
			return new Promise(resolve => setTimeout(resolve, 50))
		},
		activate() {
			valid2Activated = true
			assert.ok(true, `valid.valid2 activated`)
		},
	})

	// First go to valid.valid1
	stateRouter.go(`valid.valid1`)

	// Wait for valid1 to be activated
	await new Promise(resolve => {
		const checkInterval = setInterval(() => {
			if (valid1Activated) {
				clearInterval(checkInterval)
				resolve()
			}
		}, 50)
	})

	// Then wait for valid2 to be activated
	await new Promise(resolve => {
		const checkInterval = setInterval(() => {
			if (valid2Activated) {
				clearInterval(checkInterval)
				resolve()
			}
		}, 50)
	})
})
