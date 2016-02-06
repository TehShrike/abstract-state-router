var test = require('tape-catch')
var getTestState = require('./helpers/test-state-factory')

test('propertiesInRoute', function(t) {
	var testState = getTestState(t)
	var stateRouter = testState.stateRouter
	var hashRouter = testState.hashRouter

	t.plan(2)

	var timesActivatedCalled = 0
	stateRouter.addState({
		name: 'only',
		template: '',
		route: '/something/:param/whatever',
		activate: function(context) {
			timesActivatedCalled++

			if (timesActivatedCalled === 1) {
				t.equal(context.parameters.param, 'firstTime')
				hashRouter.go('/something/secondTime/whatever')
			} else {
				t.equal(context.parameters.param, 'secondTime')
				t.end()
			}
		}
	})

	stateRouter.go('only', { param: 'firstTime' })
})

test('inherit parent\'s parameters', function(t) {
	var testState = getTestState(t)
	var stateRouter = testState.stateRouter

	stateRouter.addState({
		name: 'parent',
		route: '/parent',
		template: 'parentTemplate',
		querystringParameters: ['parent']
	})

	stateRouter.addState({
		name: 'parent.child1',
		route: '/child1',
		template: 'child1Template',
		querystringParameters: ['child1'],
		activate: function(context) {
			process.nextTick(function() {
				stateRouter.go('parent.child2', {
					moreSpecificArg: 'yes'
				}, { inherit: true })
			})
		}
	})

	stateRouter.addState({
		name: 'parent.child2',
		route: '/child2',
		template: 'child2Template',
		activate: function(context) {
			t.equal(context.parameters.parent, 'initial parent')
			t.equal(context.parameters.moreSpecificArg, 'yes')
			t.end()
		}
	})

	stateRouter.go('parent.child1', { parent: 'initial parent' })
})

test('inherit generic parameters', function(t) {
	var testState = getTestState(t)
	var stateRouter = testState.stateRouter

	stateRouter.addState({
		name: 'parent',
		route: '/parent',
		template: 'parentTemplate'
	})

	stateRouter.addState({
		name: 'parent.child1',
		route: '/child1',
		template: 'child1Template',
		querystringParameters: ['child1'],
		activate: function(context) {
			process.nextTick(function() {
				stateRouter.go('parent.child2', {}, { inherit: true })
			})
		}
	})

	stateRouter.addState({
		name: 'parent.child2',
		route: '/child2',
		template: 'child2Template',
		activate: function(context) {
			t.equal(context.parameters.parent, 'initial parent')
			t.end()
		}
	})

	stateRouter.go('parent.child1', { parent: 'initial parent' })
})

test('can overwrite parameters when using inherit', function(t) {
	var testState = getTestState(t)
	var stateRouter = testState.stateRouter

	stateRouter.addState({
		name: 'parent',
		route: '/parent',
		template: 'parentTemplate'
	})

	stateRouter.addState({
		name: 'parent.child1',
		route: '/child1',
		template: 'child1Template',
		querystringParameters: ['child1'],
		activate: function(context) {
			process.nextTick(function() {
				stateRouter.go('parent.child2', {
					parent: 'new value'
				}, { inherit: true })
			})
		}
	})

	stateRouter.addState({
		name: 'parent.child2',
		route: '/child2',
		template: 'child2Template',
		activate: function(context) {
			t.equal(context.parameters.parent, 'new value')
			t.equal(context.parameters.whatevs, 'totally')
			t.end()
		}
	})

	stateRouter.go('parent.child1', {
		parent: 'initial parent',
		whatevs: 'totally'
	})
})

test('inherit works with replace', function(t) {
	var testState = getTestState(t)
	var stateRouter = testState.stateRouter

	stateRouter.addState({
		name: 'parent',
		route: '/parent',
		template: 'parentTemplate'
	})

	stateRouter.addState({
		name: 'parent.child1',
		route: '/child1',
		template: 'child1Template',
		querystringParameters: ['child1'],
		activate: function(context) {
			process.nextTick(function() {
				stateRouter.go('parent.child2', {
					parent: 'new value'
				}, { inherit: true, replace: true })
			})
		}
	})

	stateRouter.addState({
		name: 'parent.child2',
		route: '/child2',
		template: 'child2Template',
		activate: function(context) {
			t.equal(context.parameters.parent, 'new value')
			t.equal(context.parameters.whatevs, 'totally')
			t.end()
		}
	})

	stateRouter.go('parent.child1', {
		parent: 'initial parent',
		whatevs: 'totally'
	})
})

