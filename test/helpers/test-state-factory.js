var hashRouterFactory = require('hash-brown-router')
var hashLocationMockFactory = require('hash-brown-router/hash-location-mock')
var stateRouterFactory = require('../../')
var mockRenderFn = require('./renderer-mock')

module.exports = function getTestState(t, renderFn) {
	var location = hashLocationMockFactory()
	var hashRouter = hashRouterFactory(location)
	var stateRouter = stateRouterFactory(renderFn || mockRenderFn, 'body', hashRouter)
	hashRouter.setDefault(function noop() {})

	stateRouter.addState({
		name: 'dummy',
		route: '/dummy',
		data: {},
		render: t.fail.bind(t, 'dummy route was called')
	})

	return {
		hashRouter: hashRouter,
		stateRouter: stateRouter,
		location: location
	}
}
