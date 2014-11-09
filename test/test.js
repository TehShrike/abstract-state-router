/* Don't forget to test
- calling go with replace=true, and then having that state also call replace, or just error out the state transition

*/

var test = require('tape')
var pathtoRegexp = require('path-to-regexp')
var hashRouterFactory = require('hash-brown-router')
var hashLocationMockFactory = require('hash-brown-router/hash-location-mock')
var stateFactory = require('../')

test('activates a state', function(t) {
	var hashRouter = hashRouterFactory(hashLocationMockFactory())
	var state = stateFactory(hashRouter)

	var originalData = {}

	t.plan(2)

	state.addState('butts', '/routeButt', originalData, null, function(data, parameters, content) {
		t.equal(data, originalData, 'got back the same data object')
		t.equal(parameters.wat, 'wut', 'got the right parameter')
		t.end()
	})

	hashRouter.go('/routeButt?wat=wut')
})

