const test = require(`tape-catch`)
const getTestState = require(`./helpers/test-state-factory`)

test(`test redirecting activating the correct states`, t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		t.plan(3)

		let parentActivated = false
		let cancelEvents = 0

		stateRouter.addState({
			name: `valid`,
			route: `/valid`,
			template: {},
			resolve(data, params, cb) {
				setTimeout(cb, 50)
			},
			activate() {
				t.notOk(parentActivated, `The parent should only activate once`)
				parentActivated = true
			},
		})

		stateRouter.addState({
			name: `valid.valid1`,
			route: `/valid1`,
			template: {},
			resolve(data, params, cb) {
				setTimeout(cb.redirect, 100, `valid.valid2`)
			},
			activate() {
				t.fail(`should not activate`)
			},
		})

		stateRouter.addState({
			name: `valid.valid2`,
			route: `/valid2`,
			template: {},
			resolve(data, params, cb) {
				setTimeout(cb.redirect, 100, `valid.valid3`)
			},
			activate() {
				t.fail(`should not activate`)
			},
		})

		stateRouter.addState({
			name: `valid.valid3`,
			route: `/valid3`,
			template: {},
			resolve(data, params, cb) {
				setTimeout(cb, 100)
			},
			activate() {
				t.pass(`valid.valid3 activated`)
				t.equal(cancelEvents, 2, `Two cancel events emitted`)
				t.end()
			},
		})

		stateRouter.on(`stateChangeCancelled`, e => {
			cancelEvents++
		})

		return state
	}

	t.test(`with state.go`, t => {
		const stateRouter = startTest(t).stateRouter
		stateRouter.go(`valid.valid1`)
	})

	t.test(`by changing the url`, t => {
		const hashRouter = startTest(t).hashRouter
		hashRouter.go(`/valid/valid1`)
	})

	t.end()
})

test(`only one cancel happens if multiple redirects are called`, t => {
	function startTest(t) {
		const state = getTestState(t)
		const stateRouter = state.stateRouter
		t.plan(2)

		let cancelEvents = 0

		stateRouter.addState({
			name: `valid`,
			route: `/valid`,
			template: {},
			resolve(data, params, cb) {
				setTimeout(cb, 50)
			},
			activate() {},
		})

		stateRouter.addState({
			name: `valid.valid1`,
			route: `/valid1`,
			template: {},
			resolve(data, params, cb) {
				cb.redirect(`valid.valid3`)
				cb.redirect(`valid.valid2`)
			},
			activate() {
				t.fail(`should not activate`)
			},
		})

		stateRouter.addState({
			name: `valid.valid2`,
			route: `/valid2`,
			template: {},
			activate() {
				t.fail(`should not activate`)
			},
		})

		stateRouter.addState({
			name: `valid.valid3`,
			route: `/valid3`,
			template: {},
			resolve(data, params, cb) {
				setTimeout(cb, 100)
			},
			activate() {
				t.pass(`valid.valid3 activated`)
				t.equal(cancelEvents, 1, `One cancel event emitted`)
				t.end()
			},
		})

		stateRouter.on(`stateChangeCancelled`, e => {
			cancelEvents++
		})

		return state
	}

	t.test(`with state.go`, t => {
		const stateRouter = startTest(t).stateRouter
		stateRouter.go(`valid.valid1`)
	})

	t.test(`by changing the url`, t => {
		const hashRouter = startTest(t).hashRouter
		hashRouter.go(`/valid/valid1`)
	})

	t.end()
})
