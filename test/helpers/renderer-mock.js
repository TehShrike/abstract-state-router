var myArbitraryRenderFunction = function lol(parent, cb) {
	var child = {}

	var newObject = {
		reset: function whatever() {},
		getChildElement: function() {
			return child
		},
		teardown: function() {
			newObject.getChildElement = null
			newObject.reset = null
			newObject.teardown = null
		}
	}

	setTimeout(function() {
		cb(newObject)
	}, 100)
}

module.exports = {
	render: function render(context, cb) {
		var element = context.element
		var template = context.template
		myArbitraryRenderFunction(element, function(renderedTemplateApi) {
			cb(null, renderedTemplateApi)
		})
	},
	reset: function reset(context, cb) {
		var renderedTemplateApi = context.domApi
		var template = context.template
		renderedTemplateApi.reset()
		setTimeout(cb, 100)
	},
	destroy: function destroy(renderedTemplateApi, cb) {
		renderedTemplateApi.teardown()
		setTimeout(cb, 100)
	},
	getChildElement: function getChildElement(renderedTemplateApi, cb) {
		setTimeout(function() {
			cb(null, renderedTemplateApi.getChildElement('ui-view'))
		}, 100)
	},
	setUpMakePathFunction: function noop() {}
}
