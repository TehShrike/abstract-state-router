const test = require(`tape-catch`)
const getTestState = require(`./helpers/test-state-factory`)

test(`canLeaveState false prevents state change`, t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		t.plan(2)

		stateRouter.addState({
			name: `guarded`,
			route: `/guarded`,
			template: {},
			canLeaveState: () => {
				t.ok(true, `canLeaveState called`)
				return false
			},
			resolve() {
				return Promise.resolve()
			},
			activate(context) {
				context.on(`destroy`, () => {
					t.pass(`should not destroy guarded state`)
				})
			},
		})

		stateRouter.addState({
			name: `unreachable`,
			route: `/unreachable`,
			template: {},
			resolve() {
				t.fail(`Should not resolve`)
				return Promise.resolve()
			},
			activate() {
				// will not get called
			},
		})

		return state
	}

	t.test(`with state.go`, t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		stateRouter.go(`guarded`)

		stateRouter.on('stateChangeStart', state => {
			if (state.name === 'unreachable') {
				t.fail(`state change should not start ${ state.name }`)
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
			if (stateThatPreventedChange === 'guarded') {
				t.pass(`state change was prevented`)
			} else {
				t.fail(`state change was prevented by the wrong state`)
			}
			t.end()
		})
	})

	t.test(`by changing the URL`, t => {
		const testState = startTest(t)
		const stateRouter = testState.stateRouter
		const hashRouter = testState.hashRouter

		hashRouter.go(`/guarded`)

		let arrivedAtStart = false

		stateRouter.on('stateChangeStart', state => {
			if (state.name === 'unreachable') {
				t.fail(`state change should not start ${ state.name }`)
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
			if (stateThatPreventedChange === 'guarded') {
				t.pass(`state change was prevented`)
			} else {
				t.fail(`state change was prevented by the wrong state`)
			}
			t.end()
		})
	})

	t.end()
})

test(`canLeaveState true lets the state change`, t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		t.plan(2)

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			template: {},
			canLeaveState: () => {
				t.ok(true, `canLeaveState called`)
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

	t.test(`with state.go`, t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		stateRouter.go(`start`)

		stateRouter.on(`stateChangeEnd`, state => {
			const stateName = state.name

			if (stateName === 'start' && !arrivedAtStart) {
				arrivedAtStart = true
				stateRouter.go(`end`)
			}

			if (stateName === 'end') {
				t.pass(`state change was allowed`)
				t.end()
			}
		})

		stateRouter.on('stateChangePrevented', stateThatPreventedChange => {
			t.fail(`state change was prevented by ${ stateThatPreventedChange }`)
		})
	})

	t.test(`by changing the URL`, t => {
		const testState = startTest(t)
		const stateRouter = testState.stateRouter
		const hashRouter = testState.hashRouter

		hashRouter.go(`/start`)

		let arrivedAtStart = false

		stateRouter.on(`stateChangeEnd`, state => {
			const stateName = state.name

			if (stateName === 'start' && !arrivedAtStart) {
				arrivedAtStart = true
				hashRouter.go(`/end`)
			}

			if (stateName === 'end') {
				t.pass(`state change was allowed`)
				t.end()
			}
		})

		stateRouter.on('stateChangePrevented', stateThatPreventedChange => {
			t.fail(`state change was prevented by ${ stateThatPreventedChange }`)
		})
	})
})

test(`canLeaveState can access domApi`, t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		t.plan(2)

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			template: {},
			canLeaveState: domApi => {
				t.ok(true, `canLeaveState called`)
				if (domApi.teardown && domApi.getChildElement) {
					t.pass(`can access domApi`)
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

	t.test(`with state.go`, t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		stateRouter.go(`start`)

		stateRouter.on(`stateChangeEnd`, () => {
			const stateName = stateRouter.getActiveState().name

			if (stateName === 'start' && !arrivedAtStart) {
				arrivedAtStart = true
				stateRouter.go(`end`)
			}

			if (stateName === 'end') {
				t.end()
			}
		})
	})
})

test(`canLeaveState will only fire once`, t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		let canLeaveStateCalls = 0
		t.plan(1)

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			template: {},
			canLeaveState: () => {
				t.ok(canLeaveStateCalls === 0, `canLeaveState called`)
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
				t.end()
			},
		})

		return state
	}

	t.test(`Applying default child`, t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		stateRouter.on(`stateChangeEnd`, () => {
			const stateName = stateRouter.getActiveState().name

			if (stateName === 'start' && !arrivedAtStart) {
				arrivedAtStart = true
				stateRouter.go(`end`, { coolParameters: true })
			}
		})

		stateRouter.go(`start`)
	})

	t.test(`Going directly to child`, t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		stateRouter.on(`stateChangeEnd`, () => {
			const stateName = stateRouter.getActiveState().name

			if (stateName === 'start' && !arrivedAtStart) {
				arrivedAtStart = true
				stateRouter.go(`end.child`, { coolParameters: true })
			}
		})

		stateRouter.go(`start`)
	})

	t.test(`Applying default parameters`, t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

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
				t.end()
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

	t.test(`Getting redirected to self with different parameters`, t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

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
				t.end()
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

	t.test(`Getting redirected to a different state`, t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

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
				t.fail('should not activate')
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

	t.test(`From a child of a guarded state`, t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

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
		})

		stateRouter.go(`start.child`)
	})
})

test(`canLeaveState will not fire on state load`, t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		t.plan(1)

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
				t.fail(`canLeaveState should not be called`)
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

	stateRouter.on(`stateChangeEnd`, state => {
		const stateName = state.name
		if (stateName === 'start') {
			if (!started) {
				started = true
				stateRouter.go(`end`)
			}
		} else if (stateName === 'end') {
			t.pass('state change was allowed')
			t.end()
		}
	})

	stateRouter.on('stateChangePrevented', stateThatPreventedChange => {
		t.fail(`state change was prevented by ${ stateThatPreventedChange }`)
	})

	stateRouter.go(`start`, { foo: `bar` })
})
