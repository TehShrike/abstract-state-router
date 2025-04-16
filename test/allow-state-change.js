import { test } from 'node:test'
import assert from 'node:assert'
import getTestState from './helpers/test-state-factory.js'

test(`canLeaveState false prevents state change`, async t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter

		stateRouter.addState({
			name: `guarded`,
			route: `/guarded`,
			template: {},
			canLeaveState: () => {
				assert.ok(true, `canLeaveState called`)
				return false
			},
			resolve() {
				return Promise.resolve()
			},
			activate(context) {
				context.on(`destroy`, () => {
					assert.fail(`should not destroy guarded state`)
				})
			},
		})

		stateRouter.addState({
			name: `unreachable`,
			route: `/unreachable`,
			template: {},
			resolve() {
				assert.fail(`Should not resolve`)
				return Promise.resolve()
			},
			activate() {
				// will not get called
			},
		})

		return state
	}

	await t.test(`with state.go`, async t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		await new Promise(resolve => {
			stateRouter.go(`guarded`)

			stateRouter.on('stateChangeStart', state => {
				if (state.name === 'unreachable') {
					assert.fail(`state change should not start ${state.name}`)
				}
			})

			stateRouter.on('stateChangeEnd', state => {
				const stateName = state.name

				if (stateName === 'guarded' && !arrivedAtStart) {
					arrivedAtStart = true
					stateRouter.go(`unreachable`)
				}
			})

			stateRouter.on('stateChangePrevented', stateThatPreventedChange => {
				if (stateThatPreventedChange.name === 'guarded') {
					assert.ok(true, `state change was prevented`)
				} else {
					assert.fail(`state change was prevented by the wrong state`)
				}
				resolve()
			})
		})
	})

	await t.test(`by changing the URL`, async t => {
		const testState = startTest(t)
		const stateRouter = testState.stateRouter
		const hashRouter = testState.hashRouter

		await new Promise(resolve => {
			hashRouter.go(`/guarded`)

			let arrivedAtStart = false

			stateRouter.on('stateChangeStart', state => {
				if (state.name === 'unreachable') {
					assert.fail(`state change should not start ${state.name}`)
				}
			})

			stateRouter.on('stateChangeEnd', state => {
				const stateName = state.name

				if (stateName === 'guarded' && !arrivedAtStart) {
					arrivedAtStart = true
					hashRouter.go(`/unreachable`)
				}
			})

			stateRouter.on('stateChangePrevented', stateThatPreventedChange => {
				if (stateThatPreventedChange.name === 'guarded') {
					assert.ok(true, `state change was prevented`)
				} else {
					assert.fail(`state change was prevented by the wrong state`)
				}
				resolve()
			})
		})
	})
})

test(`canLeaveState true lets the state change`, async t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			template: {},
			canLeaveState: () => {
				assert.ok(true, `canLeaveState called`)
				return true
			},
			resolve() {
				return Promise.resolve()
			},
			activate(context) {
				//
			},
		})

		stateRouter.addState({
			name: `end`,
			route: `/end`,
			template: {},
			resolve() {
				return Promise.resolve()
			},
			activate() {
			},
		})

		return state
	}

	await t.test(`with state.go`, async t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		await new Promise(resolve => {
			stateRouter.go(`start`)

			stateRouter.on(`stateChangeEnd`, state => {
				const stateName = state.name

				if (stateName === 'start' && !arrivedAtStart) {
					arrivedAtStart = true
					stateRouter.go(`end`)
				}

				if (stateName === 'end') {
					assert.ok(true, `state change was allowed`)
					resolve()
				}
			})

			stateRouter.on('stateChangePrevented', stateThatPreventedChange => {
				assert.fail(`state change was prevented by ${stateThatPreventedChange.name}`)
			})
		})
	})

	await t.test(`by changing the URL`, async t => {
		const testState = startTest(t)
		const stateRouter = testState.stateRouter
		const hashRouter = testState.hashRouter

		await new Promise(resolve => {
			hashRouter.go(`/start`)

			let arrivedAtStart = false

			stateRouter.on(`stateChangeEnd`, state => {
				const stateName = state.name

				if (stateName === 'start' && !arrivedAtStart) {
					arrivedAtStart = true
					hashRouter.go(`/end`)
				}

				if (stateName === 'end') {
					assert.ok(true, `state change was allowed`)
					resolve()
				}
			})

			stateRouter.on('stateChangePrevented', stateThatPreventedChange => {
				assert.fail(`state change was prevented by ${stateThatPreventedChange.name}`)
			})
		})
	})
})

test(`canLeaveState can access domApi`, async t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			template: {},
			canLeaveState: domApi => {
				assert.ok(true, `canLeaveState called`)
				if (domApi.teardown && domApi.getChildElement) {
					assert.ok(true, `can access domApi`)
				}
				return true
			},
			resolve() {
				return Promise.resolve()
			},
			activate(context) {
				//
			},
		})

		stateRouter.addState({
			name: `end`,
			route: `/end`,
			template: {},
			resolve() {
				return Promise.resolve()
			},
			activate() {
			},
		})

		return state
	}

	await t.test(`with state.go`, async t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		await new Promise(resolve => {
			stateRouter.go(`start`)

			stateRouter.on(`stateChangeEnd`, () => {
				const stateName = stateRouter.getActiveState().name

				if (stateName === 'start' && !arrivedAtStart) {
					arrivedAtStart = true
					stateRouter.go(`end`)
				}

				if (stateName === 'end') {
					resolve()
				}
			})
		})
	})
})

test(`canLeaveState will only fire once`, async t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		let canLeaveStateCalls = 0

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			template: {},
			canLeaveState: () => {
				assert.strictEqual(canLeaveStateCalls, 0, `canLeaveState called`)
				canLeaveStateCalls++
				return true
			},
			resolve() {
				return Promise.resolve()
			},
			activate(context) {
			},
		})

		stateRouter.addState({
			name: `end`,
			route: `/end`,
			defaultChild: `child`,
			template: {},
			resolve() {
				return Promise.resolve()
			},
			activate() {
			},
		})

		stateRouter.addState({
			name: `end.child`,
			route: `/child`,
			template: {},
			resolve() {
				return Promise.resolve()
			},
			activate() {
			},
		})

		return state
	}

	await t.test(`Applying default child`, async t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		await new Promise(resolve => {
			stateRouter.on(`stateChangeEnd`, () => {
				const stateName = stateRouter.getActiveState().name

				if (stateName === 'start' && !arrivedAtStart) {
					arrivedAtStart = true
					stateRouter.go(`end`, { coolParameters: true })
				}

				if (stateName === 'end.child') {
					resolve()
				}
			})

			stateRouter.go(`start`)
		})
	})

	await t.test(`Going directly to child`, async t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		await new Promise(resolve => {
			stateRouter.on(`stateChangeEnd`, () => {
				const stateName = stateRouter.getActiveState().name

				if (stateName === 'start' && !arrivedAtStart) {
					arrivedAtStart = true
					stateRouter.go(`end.child`, { coolParameters: true })
				}

				if (stateName === 'end.child') {
					resolve()
				}
			})

			stateRouter.go(`start`)
		})
	})

	await t.test(`Applying default parameters`, async t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		await new Promise(resolve => {
			stateRouter.addState({
				name: `parameters`,
				route: `/parameters`,
				querystringParameters: [ `foo` ],
				defaultParameters: {
					foo: `bar`,
				},
				template: {},
				resolve() {
					return Promise.resolve()
				},
				activate() {
					resolve()
				},
			})

			stateRouter.on(`stateChangeEnd`, state => {
				const stateName = state.name

				if (stateName === 'start' && !arrivedAtStart) {
					arrivedAtStart = true
					stateRouter.go(`parameters`)
				}
			})

			stateRouter.go(`start`)
		})
	})

	await t.test(`Getting redirected to self with different parameters`, async t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		await new Promise(resolve => {
			stateRouter.addState({
				name: `will-redirect`,
				route: `/will-redirect`,
				querystringParameters: [ `redirected` ],
				defaultParameters: {
					redirected: false,
				},
				template: {},
				resolve(data, parameters) {
					if (parameters.redirected === 'false') {
						return Promise.reject({
							redirectTo: {
								name: `will-redirect`,
								params: {
									redirected: true,
								},
							},
						})
					}
					return Promise.resolve()
				},
				activate() {
					resolve()
				},
			})

			stateRouter.on(`stateChangeEnd`, state => {
				const stateName = state.name

				if (stateName === 'start' && !arrivedAtStart) {
					arrivedAtStart = true
					stateRouter.go(`will-redirect`)
				}
			})

			stateRouter.go(`start`)
		})
	})

	await t.test(`Getting redirected to a different state`, async t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		await new Promise(resolve => {
			stateRouter.addState({
				name: `will-redirect`,
				route: `/will-redirect`,
				template: {},
				resolve() {
					throw {
						redirectTo: {
							name: `end`,
						},
					}
				},
				activate() {
					assert.fail('should not activate')
				},
			})

			stateRouter.on(`stateChangeEnd`, state => {
				const stateName = state.name

				if (stateName === 'start' && !arrivedAtStart) {
					arrivedAtStart = true
					stateRouter.go(`will-redirect`)
				}

				if (stateName === 'end.child') {
					resolve()
				}
			})

			stateRouter.go(`start`)
		})
	})

	await t.test(`From a child of a guarded state`, async t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		await new Promise(resolve => {
			stateRouter.addState({
				name: `start.child`,
				route: `child`,
				template: {},
				resolve() {
					return Promise.resolve()
				},
				activate() {
				},
			})

			stateRouter.on(`stateChangeEnd`, state => {
				const stateName = state.name

				if (stateName === 'start.child' && !arrivedAtStart) {
					arrivedAtStart = true
					stateRouter.go(`end`)
				}

				if (stateName === 'end.child') {
					resolve()
				}
			})

			stateRouter.go(`start.child`)
		})
	})
})

test(`canLeaveState will not fire on state load`, async t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			querystringParameters: [ `foo` ],
			template: {},
			resolve() {
				return Promise.resolve()
			},
		})

		stateRouter.addState({
			name: `end`,
			route: `/end`,
			template: {},
			canLeaveState: () => {
				assert.fail(`canLeaveState should not be called`)
				return false
			},
			resolve() {
				return Promise.resolve()
			},
		})

		return state
	}

	const stateRouter = startTest(t).stateRouter
	let started = false

	await new Promise(resolve => {
		stateRouter.on(`stateChangeEnd`, state => {
			const stateName = state.name
			if (stateName === 'start') {
				if (!started) {
					started = true
					stateRouter.go(`end`)
				}
			} else if (stateName === 'end') {
				assert.ok(true, 'state change was allowed')
				resolve()
			}
		})

		stateRouter.on('stateChangePrevented', stateThatPreventedChange => {
			assert.fail(`state change was prevented by ${stateThatPreventedChange.name}`)
		})

		stateRouter.go(`start`, { foo: `bar` })
	})
})

test('canLeaveState passes destination parameters', async t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			querystringParameters: [ `foo` ],
			template: {},
			canLeaveState: (_domApi, destinationState) => {
				assert.strictEqual(destinationState.parameters.foo, 'bar', 'destination parameters are passed')
				assert.strictEqual(destinationState.name, 'start', 'destination state is passed')
				return true
			},
			resolve() {
				return Promise.resolve()
			},
		})

		return state
	}

	const stateRouter = startTest(t).stateRouter

	await new Promise(resolve => {
		stateRouter.on('stateChangePrevented', stateThatPreventedChange => {
			assert.fail(`state change was prevented by ${stateThatPreventedChange.name}`)
		})

		stateRouter.on('stateChangeEnd', (state, parameters) => {
			if (state.name === 'start' && !parameters.foo) {
				stateRouter.go(null, { foo: 'bar' })
			}

			if (state.name === 'start' && parameters.foo === 'bar') {
				resolve()
			}
		})

		stateRouter.go(`start`)
	})
})

test('stateChangePrevented passes source and destination parameters', async t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			querystringParameters: [ `foo` ],
			template: {},
			canLeaveState: () => {
				return false
			},
			resolve() {
				return Promise.resolve()
			},
		})

		return state
	}

	const stateRouter = startTest(t).stateRouter

	await new Promise(resolve => {
		stateRouter.on('stateChangePrevented', (stateThatPreventedChange, destinationState) => {
			assert.strictEqual(stateThatPreventedChange.name, 'start', 'source state is passed')
			assert.strictEqual(stateThatPreventedChange.parameters.foo, 'baz', 'source parameters are passed')
			assert.strictEqual(destinationState.name, 'start', 'destination state is passed')
			assert.strictEqual(destinationState.parameters.foo, 'bar', 'destination parameters are passed')
			resolve()
		})

		let started = false
		stateRouter.on('stateChangeEnd', () => {
			if (!started) {
				started = true
				stateRouter.go(null, { foo: 'bar' })
			}
		})

		stateRouter.go(`start`, { foo: 'baz' })
	})
})
