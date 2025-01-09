export default function assertingRendererFactory(t, expectedTemplates) {
	const makeRenderer = function makeRenderer() {
		return {
			render: function render(context) {
				return new Promise(resolve => {
					const template = context.template
					t.ok(expectedTemplates.length, `The render function hasn't been called too many times yet`)
					const expected = expectedTemplates.shift()
					t.equal(expected, template, `The expected template was sent to the render function`)

					process.nextTick(() => {
						resolve({ template })
					})
				})
			},
			reset: function reset() {
				throw new Error(`Reset should not be called`)
			},
			destroy: function destroy(renderedTemplateApi) {
				return new Promise(resolve => setTimeout(resolve, 100))
			},
			getChildElement: function getChildElement(renderedTemplateApi) {
				return new Promise(resolve => setTimeout(() => resolve(`dummy child element`), 100))
			},
		}
	}

	makeRenderer.expectedAssertions = expectedTemplates.length * 2

	return makeRenderer
}
