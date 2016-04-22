module.exports = function CurrentState() {
	var current = {
		name: '',
		parameters: {}
	}

	return {
		get: function() {
			return current
		},
		set: function(name, parameters) {
			current = {
				name: name,
				parameters: parameters
			}
		}
	}
}
