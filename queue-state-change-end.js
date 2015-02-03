module.exports = function QueueStateGo(emitter) {
	var queue = []

	emitter.on('stateChangeEnd', function() { //what about 'stateChangeError'
		var fn = queue.shift()
		if (typeof fn === 'function') fn()
	})

	return function queueStateGo(fn) {
		queue.push(fn)
	}
}
