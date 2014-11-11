var stateStringParser = require('./state-string-parser')

module.exports = StateState() {
	var states = {}

	function getHierarchy(name) {
		var names = stateStringParser(name)

		return names.map(function(name) {
			if (!states[name]) {
				throw new Error('State ' + name + ' not found')
			}
			return states[name]
		})
	}

	function getParent(name) {
		var parentName = getParentName(name)

		return parentName && states[parentName]
	}

	function getParentName(name) {
		var names = stateStringParser(name)

		if (names.length > 1) {
			names.pop()
			return names.join('')
		} else {
			return null
		}
	}

	return {
		add: function(name, state) {
			states[name] = state
		},
		get: function(name) {
			return states[name]
		},
		getHierarchy: getHierarchy,
		getParent: getParent,
		getParentName: getParentName
	}
}
