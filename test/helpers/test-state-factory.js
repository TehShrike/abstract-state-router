const hashRouterFactory = require('hash-brown-router')
const hashLocationMockFactory = require('hash-brown-router/hash-location-mock')
const mockRenderFn = require('./renderer-mock')

import stateRouterFactory from '../../index.js'
import defaultRouterOptions from '../../default-router-options.js'

module.exports = function getTestState(t, renderFn, options) {
	const location = hashLocationMockFactory()
	const hashRouter = hashRouterFactory(defaultRouterOptions, location)
	const stateRouter = stateRouterFactory(renderFn || mockRenderFn, 'body', Object.assign({
		router: hashRouter,
		throwOnError: false,
	}, options))

	stateRouter.addState({
		name: 'dummy',
		route: '/dummy',
		data: {},
		template: null,
		activate: t.fail.bind(t, 'dummy route was called'),
	})

	return {
		hashRouter: hashRouter,
		stateRouter: stateRouter,
		location: location,
	}
}
