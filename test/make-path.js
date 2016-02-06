var test = require('tape-catch')
var qs = require('querystring')
var getTestState = require('./helpers/test-state-factory')

function basicRouterSetup(t, options) {
	var stateRouter = getTestState(t, null, options).stateRouter

	stateRouter.addState({
		name: 'parent',
		template: '',
		route: '/parent',
		querystringParameters: [ 'thingy', 'thinger' ]
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

	t.equal(stateRouter.makePath('parent.child1', { param: 'value' }), '#/parent/child1?param=value')

	t.throws(function() {
		stateRouter.makePath('parent.doesnotexist')
	}, /doesnotexist/)

	t.end()
})

test('makePath respects the prefix option', function(t) {
	var stateRouter = basicRouterSetup(t, {
		pathPrefix: ''
	})

	t.equal(stateRouter.makePath('parent.child1', { thingy: 'value' }), '/parent/child1?thingy=value')
	t.equal(stateRouter.makePath('parent', { thingy: 'value' }), '/parent?thingy=value')

	t.end()
})

test('makePath respects the inherit option', function(t) {
	var stateRouter = basicRouterSetup(t)

	function justTheQuerystring(str) {
		var match = /\?(.+)$/.exec(str)
		return qs.parse(match[1])
	}

	stateRouter.on('stateChangeEnd', function() {
		var output = justTheQuerystring(stateRouter.makePath('parent.child2', { otherParameter: 'other value' }, { inherit: true }))
		t.equal(output.originalParameter, 'original value')
		t.equal(output.otherParameter, 'other value')
		t.equal(Object.keys(output).length, 2)

		output = justTheQuerystring(stateRouter.makePath('parent.child2', { originalParameter: 'new value' }, { inherit: true }))
		t.equal(output.originalParameter, 'new value')
		t.equal(Object.keys(output).length, 1)

		t.end()
	})

	stateRouter.go('parent.child1', {
		originalParameter: 'original value'
	})
})
