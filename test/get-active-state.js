const test = require('tape-catch')
const getTestState = require('./helpers/test-state-factory')

test('getActiveState', t => {
	const stateRouter = getTestState(t).stateRouter;

	stateRouter.addState({
		name: 'parent',
		template: '',
		route: '/parent',
	})

	stateRouter.addState({
		name: 'parent.child',
		template: '',
		route: '/child',
	})

	stateRouter.addState({
		name: 'parent.child.grandchild',
		template: '',
		route: '/grandchild',
	})

	stateRouter.on('stateChangeEnd', () => {
		t.ok(stateRouter.getActiveState().name === 'parent.child', 'child is active')
		t.notOk(stateRouter.getActiveState() === 'parent', 'parent is not active')
		t.notOk(stateRouter.getActiveState() === 'parent.child.grandchild', 'grandchild is not active')

		t.end()
	})

	stateRouter.go('parent.child')
})


test('getActiveState returns parameters', t => {
	const stateRouter = getTestState(t).stateRouter;

	stateRouter.addState({
		name: 'parent',
		template: '',
		route: '/parent',
	})

	stateRouter.addState({
		name: 'parent.child',
		template: '',
		route: '/child',
	})

	stateRouter.on('stateChangeEnd', () => {
		const params = stateRouter.getActiveState().parameters;
		t.ok(params.butts === 'yes')
		t.notOk(params.butts === 'no')
		t.notOk(!params.butts)
		t.end()
	})

	stateRouter.go('parent.child', {butts: 'yes'})
})
