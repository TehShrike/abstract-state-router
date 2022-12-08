module.exports = function assertingRendererFactory(t, expectedTemplates) {
	const makeRenderer = function makeRenderer() {
		return {
			render: function render(context, cb) {
				const template = context.template
				t.ok(expectedTemplates.length, `The render function hasn't been called too many times yet`)
				const expected = expectedTemplates.shift()
				t.equal(expected, template, `The expected template was sent to the render function`)

				process.nextTick(() => {
					cb(null, {
						template,
					})
				})
			},
			reset: function reset() {
				throw new Error(`Reset should not be called`)
			},
			destroy: function destroy(renderedTemplateApi, cb) {
				setTimeout(cb, 100)
			},
			getChildElement: function getChildElement(renderedTemplateApi, cb) {
				setTimeout(() => {
					cb(null, `dummy child element`)
				}, 100)
			},
		}
	}

	makeRenderer.expectedAssertions = expectedTemplates.length * 2

	return makeRenderer
}
