import test from 'tape-catch'
import getTestState from './helpers/test-state-factory.js'

test(`evaluateCurrentRoute with url set`, t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	const hashRouter = testState.hashRouter

	let correctRouteCalled = false

	t.plan(3)

	hashRouter.go(`/theUrlWhenThePageIsFirstOpened`)

	stateRouter.addState({
		name: `whatever`,
		route: `/ignored`,
		template: null,
		activate() {
			t.fail()
		},
	})

	stateRouter.addState({
		name: `correct`,
		route: `/theUrlWhenThePageIsFirstOpened`,
		template: null,
		activate(context) {
			t.notOk(correctRouteCalled)
			correctRouteCalled = true
			t.notOk(context.parameters.parameterName)
			t.end()
		},
	})

	t.notOk(correctRouteCalled)

	stateRouter.evaluateCurrentRoute(`whatever`, { parameterName: `wrong` })
})

test(`evaluateCurrentRoute with slash url`, t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	const hashRouter = testState.hashRouter

	let correctRouteCalled = false

	t.plan(3)

	hashRouter.go(`/`)

	stateRouter.addState({
		name: `correct`,
		route: `/`,
		template: null,
		activate(context) {
			t.notOk(correctRouteCalled)
			correctRouteCalled = true
			t.notOk(context.parameters.parameterName)
			t.end()
		},
	})

	t.notOk(correctRouteCalled)

	stateRouter.evaluateCurrentRoute(`correct`)
})

test(`evaluateCurrentRoute with no current route should go to the default`, t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter

	let correctRouteCalled = false

	t.plan(3)

	stateRouter.addState({
		name: `whatever`,
		route: `/ignored`,
		template: null,
		activate() {
			t.fail()
		},
	})

	stateRouter.addState({
		name: `correct`,
		route: `/default`,
		template: null,
		activate(context) {
			t.notOk(correctRouteCalled)

			t.equal(context.parameters.parameterName, `wrong`)
			correctRouteCalled = true
			t.end()
		},
	})

	t.notOk(correctRouteCalled)

	stateRouter.evaluateCurrentRoute(`correct`, { parameterName: `wrong` })
})
