const test = require(`tape-catch`)
const assertingRendererFactory = require(`./helpers/asserting-renderer-factory`)
const getTestState = require(`./helpers/test-state-factory`)

test(`a normal replace call against the state router itself`, t => {
	const parent1Template = {}
	const child1Template = {}
	const child2Template = {}
	const renderer = assertingRendererFactory(t, [ parent1Template, child1Template, child2Template ])
	const state = getTestState(t, renderer)
	const stateRouter = state.stateRouter
	const assertsBelow = 4
	const renderAsserts = renderer.expectedAssertions

	t.plan(assertsBelow + renderAsserts)

	let parentActivated = false
	let child1Activated = false
	let child2Activated = false

	stateRouter.addState({
		name: `valid1`,
		route: `/valid1`,
		template: parent1Template,
		activate(context) {
			t.notOk(parentActivated, `parent activated once`)
			parentActivated = true
		},
	})

	stateRouter.addState({
		name: `valid1.valid`,
		route: `/valid1`,
		template: child1Template,
		activate(context) {
			t.notOk(child1Activated, `child1 activated once`)
			child1Activated = true

			setTimeout(() => {
				stateRouter.go(`valid1.valid2`, {}, { replace: true })
			}, 10)
		},
	})

	stateRouter.addState({
		name: `valid1.valid2`,
		route: `/valid2`,
		template: child2Template,
		activate(context) {
			t.notOk(child2Activated, `child2 activated once`)
			child2Activated = true

			t.equal(state.location.get(), `/valid1/valid2`)

			t.end()
		},
	})

	stateRouter.go(`valid1.valid`)
})
