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

test('makePath inheriting parameters from the route by the time the activate function is called', function(t) {
	var stateRouter = getTestState(t, null, {
		pathPrefix: ''
	}).stateRouter

	stateRouter.addState({
		name: 'parent',
		template: '',
		route: '/parent/:someParam/yarp'
	})

	stateRouter.addState({
		name: 'parent.child1',
		template: '',
		route: '/child1',
		activate: function(context) {
			t.equal(context.parameters.someParam, 'totally')

			var path = stateRouter.makePath('parent.child2', {}, {
				inherit: true
			})

			t.equal(path, '/parent/totally/yarp/child2', 'Output path contains the route parameter')
			t.end()
		}
	})
	stateRouter.addState({
		name: 'parent.child2',
		template: '',
		route: '/child2'
	})

	stateRouter.go('parent.child1', { someParam: 'totally' })
})

test('makePath with falsey parameters', function(t) {
	var stateRouter = getTestState(t, null, {
		pathPrefix: ''
	}).stateRouter

	stateRouter.addState({
		name: 'whatever',
		template: '',
		route: '/timer/:week(\\d+)/:day(\\d+)'
	})

	var output = stateRouter.makePath('whatever', {
		week: 0,
		day: 0
	})

	t.equal(output, '/timer/0/0')
	t.end()
})

test('makePath with null state name goes to the current state', function(t) {
	var stateRouter = basicRouterSetup(t)

	stateRouter.go('parent.child2', { thinger: 'whatsit' })

	stateRouter.on('stateChangeEnd', function() {
		var output = stateRouter.makePath(null, { thinger: 'eh' })
		t.equal(output, '#/parent/child2?thinger=eh')
		t.end()
	})
})
