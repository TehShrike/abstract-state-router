function myArbitraryRenderFunction(parent, cb) {
	const child = {}

	const newObject = {
		reset: function whatever() {},
		getChildElement() {
			return child
		},
		teardown() {
			newObject.getChildElement = null
			newObject.reset = null
			newObject.teardown = null
		},
	}

	setTimeout(() => {
		cb(newObject)
	}, 100)
}

module.exports = function makeRenderer(stateRouter) {
	return {
		render: function render(context, cb) {
			const element = context.element
			myArbitraryRenderFunction(element, renderedTemplateApi => {
				cb(null, renderedTemplateApi)
			})
		},
		reset: function reset(context, cb) {
			const renderedTemplateApi = context.domApi
			renderedTemplateApi.reset()
			setTimeout(cb, 100)
		},
		destroy: function destroy(renderedTemplateApi, cb) {
			renderedTemplateApi.teardown()
			setTimeout(cb, 100)
		},
		getChildElement: function getChildElement(renderedTemplateApi, cb) {
			setTimeout(() => {
				cb(null, renderedTemplateApi.getChildElement(`ui-view`))
			}, 100)
		},
	}
}
