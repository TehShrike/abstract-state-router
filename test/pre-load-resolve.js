var test = require('tape-catch')
var getTestState = require('./helpers/test-state-factory')

test('global pre-loaded data is available in activate function', function(t) {
	var testState = getTestState(t)
	var stateRouter = testState.stateRouter

	// the global pre-loaded object
	abstractStateRouterPreLoadedResolveDataMap = { // jshint ignore:line
		pants: {
			size: 'huge'
		}
	}

	t.plan(1)

	stateRouter.addState({
		name: 'pants',
		template: '',
		resolve: function(data, parameters, cb) {
			t.fail('resolve has pre-loaded data so should not run')
			cb(false)
		},
		activate: function(context) {
			t.equal(context.content.size, 'huge', 'activate should access pre-loaded data')
			t.end()
		}
	})

	stateRouter.go('pants')
})
