const test = require('tape-catch')
const getTestState = require('./helpers/test-state-factory')

test('stateIsActive', t => {
	const stateRouter = getTestState(t).stateRouter

	t.plan(6)

	stateRouter.addState({
		name: 'parent',
		template: '',
		route: '/parent',
	})

	stateRouter.addState({
		name: 'parent.child1',
		template: '',
		route: '/child1',
	})

	stateRouter.addState({
		name: 'parent.child2',
		template: '',
		route: '/child2',
	})

	stateRouter.on('stateChangeEnd', () => {
		t.ok(stateRouter.stateIsActive('parent'), 'parent is active')
		t.ok(stateRouter.stateIsActive('parent.child1'), 'parent.child1 is active')
		t.notOk(stateRouter.stateIsActive('parent.child2'), 'parent.child2 is not active')
		t.notOk(stateRouter.stateIsActive('not a real state'), 'non-existant state is not active')

		t.notOk(stateRouter.stateIsActive('parent.child1', { butts: 'no' }), 'shouldn\'t match wuth butts=no')
		t.ok(stateRouter.stateIsActive('parent.child1', { butts: 'yes' }), 'should match with butts=yes')

		t.end()
	})

	stateRouter.go('parent.child1', { butts: 'yes' })
})

test('stateIsActive but states with that substring are not', t => {
	const stateRouter = getTestState(t).stateRouter

	t.plan(4)

	stateRouter.addState({
		name: 'parent',
		template: '',
		route: '/parent',
	})

	stateRouter.addState({
		name: 'parent-thing',
		template: '',
		route: '/parent-thing',
	})

	stateRouter.addState({
		name: 'parent.child',
		template: '',
		route: '/child',
	})

	stateRouter.addState({
		name: 'parent.child-thing',
		template: '',
		route: '/child-thing',
	})

	stateRouter.on('stateChangeEnd', () => {
		t.ok(stateRouter.stateIsActive('parent'), 'parent is active')
		t.notOk(stateRouter.stateIsActive('parent-thing'), 'parent-thing is not active')

		t.notOk(stateRouter.stateIsActive('parent.child'), 'parent.child is active')
		t.ok(stateRouter.stateIsActive('parent.child-thing'), 'parent.child-thing is not active')

		t.end()
	})

	stateRouter.go('parent.child-thing', { butts: 'yes' })
})

test('stateIsActive compares parameters', t => {
	const stateRouter = getTestState(t).stateRouter

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
		t.ok(stateRouter.stateIsActive('parent.child', { butts: 'yes' }))
		t.notOk(stateRouter.stateIsActive('parent.child', { butts: 'no' }))
		t.end()
	})

	stateRouter.go('parent.child', { butts: 'yes' })
})

test('null parameters passed to stateIsActive are equivalent to passing in nothing', t => {
	const stateRouter = getTestState(t).stateRouter

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
		t.ok(stateRouter.stateIsActive('parent.child', null))
		t.ok(stateRouter.stateIsActive('parent', null))

		t.end()
	})

	stateRouter.go('parent.child', { butts: 'yes' })
})
