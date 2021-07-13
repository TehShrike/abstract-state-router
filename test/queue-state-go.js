const test = require(`tape-catch`)
const getTestState = require(`./helpers/test-state-factory`)

test(`test queue with a basic activate-in-order test`, t => {
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
				setTimeout(cb, 100)
			},
			activate() {
				t.notOk(parentActivated, `Should only activate once`)
				parentActivated = true
			},
		})

		stateRouter.addState({
			name: `valid.valid1`,
			route: `/valid1`,
			template: {},
			resolve(data, params, cb) {
				setTimeout(cb, 100)
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
		stateRouter.go(`valid.valid2`)
		stateRouter.go(`valid.valid3`)
	})

	t.test(`by changing the url`, t => {
		const hashRouter = startTest(t).hashRouter
		hashRouter.go(`/valid/valid1`)
		hashRouter.go(`/valid/valid2`)
		hashRouter.go(`/valid/valid3`)
	})

	t.end()
})

test(`test queue a state.go happening during a render`, t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter
	t.plan(3)
	t.timeoutAfter(1000)

	let parentActivated = false

	stateRouter.addState({
		name: `valid`,
		route: `/valid`,
		template: {},
		resolve(data, params, cb) {
			setTimeout(cb, 100)
		},
		activate() {
			t.notOk(parentActivated, `Should only activate once`)
			parentActivated = true
		},
	})

	stateRouter.addState({
		name: `valid.valid1`,
		route: `/valid1`,
		template: {},
		resolve(data, params, cb) {
			t.pass(`valid.valid1 resolve called`)
			setTimeout(cb, 100)
			process.nextTick(() => {
				stateRouter.go(`valid.valid2`)
			})
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
			setTimeout(cb, 100)
		},
		activate() {
			t.pass(`valid.valid2 activated`)
			t.end()
		},
	})

	stateRouter.go(`valid.valid1`)
})

test(`test queue a state.go when the last transition is in the middle of activating`, t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter
	t.plan(4)

	let firstTimeParentHasBeenActivated = true
	let valid2Activated = false

	stateRouter.addState({
		name: `valid`,
		route: `/valid`,
		template: {},
		resolve(data, params, cb) {
			setTimeout(cb, 100)
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
		resolve(data, params, cb) {
			t.pass(`valid.valid1 resolve called`)
			setTimeout(cb, 100)
		},
		activate() {
			t.notOk(valid2Activated, `valid2 should not be activated yet`)
			t.pass(`valid.valid1 should activate`)
		},
	})

	stateRouter.addState({
		name: `valid.valid2`,
		route: `/valid2`,
		template: {},
		resolve(data, params, cb) {
			setTimeout(cb, 50)
		},
		activate() {
			valid2Activated = true
			t.pass(`valid.valid2 activated`)
			t.end()
		},
	})

	stateRouter.go(`valid.valid1`)
})
