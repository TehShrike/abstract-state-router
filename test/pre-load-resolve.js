var test = require('tape-catch')
var getTestState = require('./helpers/test-state-factory')

test('global pre-loaded data is available in activate function', function(t) {
	var testState = getTestState(t)
	var stateRouter = testState.stateRouter

	// the global pre-loaded object
	abstractStateRouterPreLoadedResolveDataMap = {
		pants: {
			size: 'huge'
		}
	}

	t.plan(2)

	stateRouter.addState({
		name: 'pants',
		template: '',
		resolve: function(data, parameters, cb) {
			t.fail('resolve has pre-loaded data so should not run')
		},
		activate: function(context) {
			t.equal(context.content.size, 'huge', 'activate should access pre-loaded data')
			t.notOk(abstractStateRouterPreLoadedResolveDataMap.pants, 'the pre-loaded data should be deleted from the global variable')
			t.end()
		}
	})

	stateRouter.go('pants')
})
