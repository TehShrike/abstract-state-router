var test = require('tape')
var getTestState = require('./helpers/test-state-factory')

function basicRouterSetup(t, options) {
	var stateRouter = getTestState(t, null, options).stateRouter

	stateRouter.addState({
		name: 'parent',
		template: '',
		route: '/parent',
		parameters: [ 'thingy', 'thinger' ]
	})

	stateRouter.addState({
		name: 'parent.child1',
		template: '',
		route: '/child1'
	})

	stateRouter.addState({
		name: 'parent.child2',
		template: '',
		route: '/child2'
	})

	return stateRouter
}

test('makePath builds a path and throws on non-existant state', function(t) {

	t.plan(2)

	var stateRouter = basicRouterSetup(t)

	t.equal('#/parent/child1?param=value', stateRouter.makePath('parent.child1', { param: 'value' }))

	t.throws(function() {
		stateRouter.makePath('parent.doesnotexist')
	}, /doesnotexist/)

	t.end()
})

test('makePath respects the prefix option', function(t) {
	var stateRouter = basicRouterSetup(t, {
		pathPrefix: ''
	})

	t.equal('/parent/child1?thingy=value', stateRouter.makePath('parent.child1', { thingy: 'value' }))
	t.equal('/parent?thingy=value', stateRouter.makePath('parent', { thingy: 'value' }))

	t.end()
})
