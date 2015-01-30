var test = require('tape')
var getTestState = require('./helpers/test-state-factory')
var extend = require('extend')


function basicTest(t, startName, endName, states) {
	var stateRouter = getTestState(t).stateRouter

	var lastActivate = ''

	states.forEach(function (state) {
		stateRouter.addState(
			extend({}, state, {
				data: state.name,
				route: '/yak',
				template: {},
				resolve: function resolve(data, parameters, cb) {
					setTimeout(cb, 10, null)
				},
				activate: function activate(context) {
					lastActivate = context.data
					t.equal(endName.indexOf(context.data), 0, '')
				}
			})
		)
	})


	stateRouter.once('stateChangeStart', function() {
		t.pass('started')
	})
	stateRouter.once('stateChangeEnd', function() {
		var msg = 'last activated state should be the target ending state'
		t.equal(lastActivate, endName, msg)
		t.end()
	})
	stateRouter.on('stateChangeError', function (e) {
		t.notOk(e, e ? e.message : 'no error')
	})
	stateRouter.go(startName)
}


test('default child', function (t) {
	var states = [
		{ name: 'hey', defaultChild: function() {return 'rofl'} },
		{ name: 'hey.rofl', defaultChild: 'copter'},
		{ name: 'hey.rofl.copter' },
		{ name: 'hey.rofl.cat'}
	]
	basicTest(t, 'hey', 'hey.rofl.copter', states)
})
