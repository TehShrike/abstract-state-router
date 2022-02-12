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

test(`redirecting to a child from a parent state reruns the parent's resolve function`, t => {
	const { stateRouter } = getTestState(t)

	t.plan(2)

	let parentResolvedCount = 0

	stateRouter.addState({
		name: `valid`,
		route: `/valid`,
		template: {},
		async resolve(data, params, cb) {
			parentResolvedCount++
			if (!params.anyKey) {
				return cb.redirect(`valid.valid1`, { anyKey: `yes?` })
			}
			t.equal(parentResolvedCount, 2, `first it redirected, then it ran again`)
		},
	})

	stateRouter.addState({
		name: `valid.valid1`,
		route: `/valid1/:anyKey`,
		template: {},
		activate() {
			t.pass(`valid.valid1 activated`)
			t.end()
		},
	})

	stateRouter.go(`valid`)
})

test(`redirecting to a child in an ancestor state multiple times reruns all the ancestor resolves`, t => {
	const { stateRouter } = getTestState(t)

	let parentResolveCallCount = 0
	let parentResolvedCount = 0
	let childResolveCalledCount = 0
	let childResolvedCount = 0

	stateRouter.addState({
		name: `app`,
		route: `/app`,
		template: {},
		querystringParameters: [ `dont_redirect_parent` ],
		resolve: async(data, params) => {
			parentResolveCallCount++
			if (!params.dont_redirect_parent) {
				return Promise.reject({
					redirectTo: {
						name: `app.child`,
						params: {
							dont_redirect_parent: true,
						},
					},
				})
			}
			parentResolvedCount++
			return {}
		},
	})

	stateRouter.addState({
		name: `app.child`,
		route: `/child`,
		template: {},
		resolve: async(data, params) => {
			childResolveCalledCount++
			if (!params.dont_redirect_child) {
				return Promise.reject({
					redirectTo: {
						name: `app.child.node`,
						params: {
							dont_redirect_parent: true,
							dont_redirect_child: true,
						},
					},
				})
			}
			childResolvedCount++
			return {}
		},
	})

	stateRouter.addState({
		name: `app.child.node`,
		route: `/node`,
		template: {},
		querystringParameters: [ `dont_redirect_child` ],
		activate() {
			t.equal(parentResolveCallCount, 3, `parent state resolve function was called thrice`)
			t.equal(parentResolvedCount, 2, `parent state was resolved twice`)
			t.equal(childResolveCalledCount, 2, `child state resolve function was called twice`)
			t.equal(childResolvedCount, 1, `child state was resolved once`)
			t.pass(`app.child.node activated`)
			t.end()
		},
	})

	stateRouter.go(`app`)
})
