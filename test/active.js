const test = require('tape-catch')
const getTestState = require('./helpers/test-state-factory')

test('active', t => {
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
		t.ok(stateRouter.active() === 'parent.child', 'child is active')
		t.notOk(stateRouter.active() === 'parent', 'parent is not active')
		t.notOk(stateRouter.active() === 'grandchild', 'grandchild is not active')

		t.end()
	})

	stateRouter.go('parent.child')
})

