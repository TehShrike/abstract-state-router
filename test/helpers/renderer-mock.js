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
	render: function render(element, template, cb) {
		myArbitraryRenderFunction(element, function(renderedTemplateApi) {
			cb(null, renderedTemplateApi)
		})
	},
	reset: function reset(renderedTemplateApi, cb) {
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
	}
}
