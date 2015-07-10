module.exports = function (emitter) {
	var currentTransitionAttempt = null
	var nextTransition = null

	function doneTransitioning() {
		currentTransitionAttempt = null
		if (nextTransition) {
			beginNextTransitionAttempt()
		}
	}

	function isTransitioning() {
		return !!currentTransitionAttempt
	}

	function beginNextTransitionAttempt() {
		currentTransitionAttempt = nextTransition
		nextTransition = null
		currentTransitionAttempt.beginStateChange()
	}

	function cancelCurrentTransition() {
		currentTransitionAttempt.transition.cancelled = true
		var err = new Error('State transition cancelled by the state transition manager')
		err.wasCancelledBySomeoneElse = true
		emitter.emit('stateChangeCancelled', err)
	}

	emitter.on('stateChangeAttempt', function(beginStateChange) {
		nextTransition = createStateTransitionAttempt(beginStateChange)

		if (isTransitioning() && currentTransitionAttempt.transition.cancellable) {
			cancelCurrentTransition()
		} else if (!isTransitioning()) {
			beginNextTransitionAttempt()
		}
	})

	emitter.on('stateChangeError', doneTransitioning)
	emitter.on('stateChangeCancelled', doneTransitioning)
	emitter.on('stateChangeEnd', doneTransitioning)

	function createStateTransitionAttempt(beginStateChange) {
		var transition = {
			cancelled: false,
			cancellable: true
		}
		return {
			transition: transition,
			beginStateChange: beginStateChange.bind(null, transition)
		}
	}
}
