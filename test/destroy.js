const test = require(`tape-catch`)
const assertingRendererFactory = require(`./helpers/asserting-renderer-factory`)
const getTestState = require(`./helpers/test-state-factory`)

test(`moving from x.y.z to x destroys z then y`, t => {
	function basicTest(t) {
		const grandparentTemplate = {}
		const parentTemplate = {}
		const childTemplate = {}

		const renderer = assertingRendererFactory(t, [ grandparentTemplate, parentTemplate, childTemplate ])
		const state = getTestState(t, renderer)
		const stateRouter = state.stateRouter
		const assertsBelow = 2
		const renderAsserts = renderer.expectedAssertions

		t.plan(assertsBelow + renderAsserts)

		let childDestroyed = false
		let parentDestroyed = false

		stateRouter.addState({
			name: `hey`,
			route: `/hay`,
			template: grandparentTemplate,
			resolve(data, parameters) {
				return new Promise(resolve => setTimeout(resolve, 0))
			},
			activate(context) {
				context.on(`destroy`, () => {
					t.fail(`grandparent should not be destroyed`)
				})
			},
		})

		stateRouter.addState({
			name: `hey.rofl`,
			route: `/routeButt`,
			template: parentTemplate,
			resolve(data, parameters) {
				return new Promise(resolve => setTimeout(resolve, 10))
			},
			querystringParameters: [ `wat` ],
			activate(context) {
				context.on(`destroy`, () => {
					parentDestroyed = true
					t.ok(childDestroyed, `parent gets destroyed after child`)
				})
			},
		})

		stateRouter.addState({
			name: `hey.rofl.copter`,
			route: `/lolcopter`,
			template: childTemplate,
			resolve(data, parameters) {
				return new Promise(resolve => setTimeout(resolve, 0))
			},
			activate(context) {
				context.on(`destroy`, () => {
					t.notOk(parentDestroyed, `child gets destroyed before parent`)
					childDestroyed = true
				})
			},
		})

		return state
	}

	t.test(`triggered with go()`, t => {
		const stateRouter = basicTest(t).stateRouter
		stateRouter.go(`hey.rofl.copter`, { wat: `wut` })
		stateRouter.once(`stateChangeEnd`, () => {
			stateRouter.go(`hey`)
			stateRouter.once(`stateChangeEnd`, () => {
				t.end()
			})
		})
	})

	t.test(`triggered by the router`, t => {
		const testState = basicTest(t)
		const hashRouter = testState.hashRouter
		hashRouter.go(`/hay/routeButt/lolcopter?wat=wut`)
		testState.stateRouter.once(`stateChangeEnd`, () => {
			hashRouter.go(`/hay`)
			testState.stateRouter.once(`stateChangeEnd`, () => {
				t.end()
			})
		})
	})
})

test(`a state with changing querystring gets destroyed`, t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter
	let parentResolveCalled = 0
	let parentActivated = 0
	let parentDestroyed = 0
	let child1Destroyed = 0

	t.plan(5)

	stateRouter.addState({
		name: `parent`,
		route: `/parent`,
		template: null,
		querystringParameters: [ `aParam` ],
		resolve(data, parameters) {
			return new Promise(resolve => {
				parentResolveCalled++
				if (parentResolveCalled === 2) {
					t.equal(parameters.aParam, `3`, `parameter was set correctly in second resolve`)
				}

				resolve({})
			})
		},
		activate(context) {
			parentActivated++
			context.on(`destroy`, () => {
				parentDestroyed++
			})
		},
	})

	stateRouter.addState({
		name: `parent.child1`,
		route: `/child1`,
		template: null,
		activate(context) {
			context.on(`destroy`, () => {
				child1Destroyed++
			})

			stateRouter.go(`parent.child2`, {
				aParam: `3`,
			})
		},
	})

	stateRouter.addState({
		name: `parent.child2`,
		route: `/child2`,
		template: null,
		activate(context) {
			t.equal(parentResolveCalled, 2, `parent resolve called twice`)
			t.equal(parentActivated, 2, `parent activated twice`)
			t.equal(child1Destroyed, 1, `child1 destroyed once`)
			t.equal(parentDestroyed, 1, `parent destroyed once`)
			t.end()
		},
	})

	stateRouter.go(`parent.child1`)
})

test(`When navigating to the same state as before, make sure the data from the child's resolve gets passed along`, t => {
	const state = getTestState(t)
	const stateRouter = state.stateRouter

	let activations = 0

	t.plan(2)

	stateRouter.addState({
		name: `parent`,
		route: `/parent`,
		template: null,
		querystringParameters: [ `aParam` ],
		// eslint-disable-next-line require-await
		async resolve() {
			return {
				legit: true,
			}
		},
		activate({ content }) {
			activations++

			t.equal(content.legit, true)

			if (activations === 2) {
				t.end()
			} else {
				stateRouter.go(`parent`, { aParam: `something different` })
			}
		},
	})

	stateRouter.go(`parent`)
})
