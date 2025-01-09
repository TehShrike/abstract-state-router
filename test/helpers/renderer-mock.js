async function myArbitraryRenderFunction(parent) {
	const child = {}

	const newObject = {
		getChildElement() {
			return child
		},
		teardown() {
			newObject.getChildElement = null
			newObject.teardown = null
		},
	}

	return newObject
}

export default function makeRenderer(stateRouter) {
	return {
		async render(context) {
			const element = context.element
			return await myArbitraryRenderFunction(element)
		},
		async destroy(renderedTemplateApi) {
			await renderedTemplateApi.teardown()
		},
		async getChildElement(renderedTemplateApi) {
			return await renderedTemplateApi.getChildElement(`ui-view`)
		},
	}
}
