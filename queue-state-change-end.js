module.exports = function QueueStateGo(emitter) {
	var queue = []

	function onStateChangeFinished() {
		var fn = queue.shift()
		if (typeof fn === 'function') fn()
	}

	emitter.on('stateChangeEnd', onStateChangeFinished)
	emitter.on('stateChangeError', onStateChangeFinished)

	return function queueStateGo(fn) {
		queue.push(fn)
	}
}
