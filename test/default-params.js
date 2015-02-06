var test = require('tape')
var getTestState = require('./helpers/test-state-factory')

test('default querystring parameters', function(tt) {
    function basicTest(tt, testName, params, expectParams, expectLocation) {
        tt.test(testName, function(t) {
            var state = getTestState(t)
            var stateRouter = state.stateRouter
            t.plan(2)

            stateRouter.addState({
                name: 'state',
                route: '/state',
                template: {},
                querystringParameters: [ 'wat', 'much' ],
                defaultQuerystringParameters: { wat: 'lol', much: 'neat' },
                activate: function(context) {
                    t.deepEqual(context.parameters, expectParams)
                    t.equal(state.location.get(), expectLocation)
                    t.end()
                }
            })

            stateRouter.go('state', params)
        })
    }

    basicTest(tt,
        'params override defaults',
        { wat: 'waycool', much: 'awesome', hi: 'world' },
        { wat: 'waycool', much: 'awesome', hi: 'world' },
        '/state?wat=waycool&much=awesome&hi=world'
    )

    basicTest(tt,
        'defaults and params are applied',
        { wat: 'roflol'},
        { wat: 'roflol', much: 'neat'},
        '/state?wat=roflol&much=neat'
    )

    basicTest(tt,
        'defaults are applied',
        {},
        { wat: 'lol', much: 'neat'},
        '/state?wat=lol&much=neat'
    )
})

test('race conditions on redirects', function(t) {
        var state = getTestState(t)
        var stateRouter = state.stateRouter
        var firstStateActivated = false
        t.plan(5)

        stateRouter.addState({
            name: 'state1',
            route: '/state1',
            template: {},
            querystringParameters: [ 'wat', 'much' ],
            defaultQuerystringParameters: { wat: 'lol', much: 'neat' },
            activate: function(context) {
                t.deepEqual({ wat: 'lol', much: 'neat' }, context.parameters)
                t.equal(state.location.get(), '/state1?wat=lol&much=neat')
                firstStateActivated = true
            }
        })

        stateRouter.addState({
            name: 'state2',
            route: '/state2',
            template: {},
            querystringParameters: [ 'wat', 'much' ],
            defaultQuerystringParameters: { wat: 'lol', much: 'neat' },
            activate: function(context) {
            	t.ok(firstStateActivated, 'The other state was activated first')
                t.deepEqual({ wat: 'waycool', much: 'awesome', hi: 'world' }, context.parameters)
                t.equal(state.location.get(), '/state2?wat=waycool&much=awesome&hi=world')
                t.end()
            }
        })


        stateRouter.go('state1', {}) //redirects
        stateRouter.go('state2', { wat: 'waycool', much: 'awesome', hi: 'world' }) //does not redirect
})
