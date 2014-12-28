var myArbitraryRenderFunction = function lol(parent, cb) {
	var child = {}

	var newObject = {
		changeDataInView: function whatever() {},
		getChildElement: function() {
			return child
		},
		teardown: function() {
			newObject.getChildElement = null
			newObject.changeDataInView = null
			newObject.teardown = null
		}
	}

	setTimeout(function() {
		cb(newObject)
	}, 500)
}


module.exports = function renderingFunction(element, template, emitter, cb) {
	myArbitraryRenderFunction(element, function(renderedTemplateApi) {
		var childElement = renderedTemplateApi.getChildElement('ui-view')

		cb(null, childElement)

		emitter.on('change', function(newParameters, newData) {
			renderedTemplateApi.changeDataInView(newParameters, newData)
		})

		emitter.on('destroy', function() {
			renderedTemplateApi.teardown()
		})
	})
}
