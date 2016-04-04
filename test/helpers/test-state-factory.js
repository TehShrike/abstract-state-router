var hashRouterFactory = require('hash-brown-router')
var hashLocationMockFactory = require('hash-brown-router/hash-location-mock')
var stateRouterFactory = require('../../')
var defaultRouterOptions = require('../../default-router-options.js')
var mockRenderFn = require('./renderer-mock')
var extend = require('xtend')

module.exports = function getTestState(t, renderFn, options) {
	var location = hashLocationMockFactory()
	var hashRouter = hashRouterFactory(defaultRouterOptions, location)
	var stateRouter = stateRouterFactory(renderFn || mockRenderFn, 'body', extend({
		router: hashRouter,
		throwOnError: false
	}, options))

	stateRouter.addState({
		name: 'dummy',
		route: '/dummy',
		data: {},
		template: null,
		activate: t.fail.bind(t, 'dummy route was called')
	})

	return {
		hashRouter: hashRouter,
		stateRouter: stateRouter,
		location: location
	}
}
