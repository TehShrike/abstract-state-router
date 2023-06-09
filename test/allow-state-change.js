const test = require(`tape-catch`)
const getTestState = require(`./helpers/test-state-factory`)

test(`allowStateChange false prevents state change`, t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		t.plan(2)

		stateRouter.addState({
			name: `guarded`,
			route: `/guarded`,
			template: {},
			allowStateChange: () => {
				t.ok(true, `allowStateChange called`)
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

	// TODO: I'm not sure how to write a test for the hashRouter

	t.end()
})

test(`allowStateChange true lets the state change`, t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		t.plan(2)

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			template: {},
			allowStateChange: () => {
				t.ok(true, `allowStateChange called`)
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

	// TODO: I'm not sure how to write a test for the hashRouter
})

test(`allowStateChange can access domApi`, t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		t.plan(2)

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			template: {},
			allowStateChange: domApi => {
				t.ok(true, `allowStateChange called`)
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

	// TODO: I'm not sure how to write a test for the hashRouter
})

test(`allowStateChange will only fire once when getting redirected to a child`, t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		let allowStateChangeCalls = 0
		t.plan(1)

		stateRouter.addState({
			name: `start`,
			route: `/start`,
			template: {},
			allowStateChange: () => {
				t.ok(allowStateChangeCalls === 0, `allowStateChange called`)
				allowStateChangeCalls++
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

	t.test(`with state.go and applying default child`, t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		stateRouter.on(`stateChangeEnd`, () => {
			const stateName = stateRouter.getActiveState().name

			if (stateName === 'start' && !arrivedAtStart) {
				arrivedAtStart = true
				stateRouter.go(`end`)
			}
		})

		stateRouter.go(`start`)
	})

	t.test(`with state.go and going directly to child`, t => {
		const stateRouter = startTest(t).stateRouter
		let arrivedAtStart = false

		stateRouter.on(`stateChangeEnd`, () => {
			const stateName = stateRouter.getActiveState().name

			if (stateName === 'start' && !arrivedAtStart) {
				arrivedAtStart = true
				stateRouter.go(`end.child`)
			}
		})

		stateRouter.go(`start`)
	})

	// TODO: I'm not sure how to write a test for the hashRouter
})
