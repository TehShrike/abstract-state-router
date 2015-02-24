module.exports = function assertingRendererFactory(t, expectedTemplates) {
	return {
		render: function render(context, cb) {
			var template = context.template
			t.ok(expectedTemplates.length, 'The render function hasn\'t been called too many times yet')
			var expected = expectedTemplates.shift()
			t.equal(expected, template, 'The expected template was sent to the render function')

			process.nextTick(function() {
				cb(null, {
					template: template
				})
			})
		},
		reset: function reset(context, cb) {
			setTimeout(cb, 100)
		},
		destroy: function destroy(renderedTemplateApi, cb) {
			setTimeout(cb, 100)
		},
		getChildElement: function getChildElement(renderedTemplateApi, cb) {
			setTimeout(function() {
				cb(null, 'dummy child element')
			}, 100)
		},
		expectedAssertions: expectedTemplates.length * 2
	}
}
