var test = require('tape')
var getTestState = require('./helpers/test-state-factory')

test('All dom functions called in order', function(t) {
	function noop() {}

	var actions = []

	var renderer = {
		render: function render(element, template, cb) {
			actions.push('render ' + template + ' on ' + element)
			cb(null, template)
		},
		reset: function reset(renderedTemplateApi, cb) {
			actions.push('reset ' + renderedTemplateApi)
			cb()
		},
		destroy: function destroy(renderedTemplateApi, cb) {
			actions.push('destroy ' + renderedTemplateApi)
			cb()
		},
		getChildElement: function getChildElement(renderedTemplateApi, cb) {
			actions.push('getChild ' + renderedTemplateApi)
			cb(null, renderedTemplateApi + ' child')
		}
	}

	var state = getTestState(t, renderer)

	var expectedActions = [
		'render topTemplate on body',
		'getChild topTemplate',
		'render topFirstTemplate on topTemplate child',
		'activate top',
		'activate top.first',
		'destroy topFirstTemplate',
		'reset topTemplate',
		'getChild topTemplate',
		'render topSecondTemplate on topTemplate child',
		'activate top',
		'activate top.second'
	]

	t.plan(expectedActions.length)

	state.stateRouter.addState({
		name: 'top',
		template: 'topTemplate',
		querystringParameters: ['myFancyParam'],
		activate: function() {
			actions.push('activate top')
		}
	})

	state.stateRouter.addState({
		name: 'top.first',
		template: 'topFirstTemplate',
		route: '/first',
		activate: function() {
			actions.push('activate top.first')
			state.stateRouter.go('top.second', {
				myFancyParam: 'groovy dude'
			})
		}
	})

	state.stateRouter.addState({
		name: 'top.second',
		template: 'topSecondTemplate',
		route: '/second',
		activate: function() {
			actions.push('activate top.second')
			expectedActions.forEach(function(planned, index) {
				t.equal(actions[index], planned, planned)
			})
			t.end()
		}
	})

	state.stateRouter.go('top.first')
})
