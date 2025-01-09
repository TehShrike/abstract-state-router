import hashRouterFactory from 'hash-brown-router'
import hashLocationMockFactory from 'hash-brown-router/hash-location-mock.js'
import stateRouterFactory from '../../index.js'
import defaultRouterOptions from '../../default-router-options.js'
import mockRenderFn from './renderer-mock.js'

export default function getTestState(t, renderFn, options) {
	const location = hashLocationMockFactory()
	const hashRouter = hashRouterFactory(defaultRouterOptions, location)
	const stateRouter = stateRouterFactory(renderFn || mockRenderFn, `body`, { router: hashRouter,
		throwOnError: false, ...options })

	stateRouter.addState({
		name: `dummy`,
		route: `/dummy`,
		data: {},
		template: null,
		activate: t.fail.bind(t, `dummy route was called`),
	})

	return {
		hashRouter,
		stateRouter,
		location,
	}
}
