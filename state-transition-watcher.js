module.exports = function (emitter) {
	var transitioning = false

	function set(newValue) {
		return function() {
			transitioning = newValue
		}
	}

	function get() {
		return transitioning
	}

	emitter.on('stateChangeAttempt', set(true))
	emitter.on('stateChangeStart', set(true))
	
	emitter.on('stateChangeError', set(false))
	emitter.on('stateChangeCancelled', set(false))
	emitter.on('stateChangeEnd', set(false))

	return get
}
