const test = require(`tape-catch`)
const getTestState = require(`./helpers/test-state-factory`)

test(`getActiveState with no parameters`, t => {
	const stateRouter = getTestState(t).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent`,
	})

	stateRouter.addState({
		name: `parent.child`,
		template: ``,
		route: `/child`,
	})

	stateRouter.addState({
		name: `parent.child.grandchild`,
		template: ``,
		route: `/grandchild`,
	})

	stateRouter.on(`stateChangeEnd`, () => {
		t.deepEqual(stateRouter.getActiveState(), {
			name: `parent.child`,
			parameters: {},
		})

		t.end()
	})

	stateRouter.go(`parent.child`)
})


test(`getActiveState returns parameters`, t => {
	const stateRouter = getTestState(t).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent`,
	})

	stateRouter.addState({
		name: `parent.child`,
		template: ``,
		route: `/child`,
	})

	stateRouter.on(`stateChangeEnd`, () => {
		t.equal(stateRouter.getActiveState().parameters.butts, `yes`)

		t.end()
	})

	stateRouter.go(`parent.child`, { butts: `yes` })
})
