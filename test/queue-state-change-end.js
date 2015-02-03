var test = require('tape')
var QueueStateGo = require('../queue-state-change-end')
var EventEmitter = require('events').EventEmitter

test('queue state.go', function(t) {
	t.plan(6)
	var fakeStateProvider = new EventEmitter()
	var pushToQueue = QueueStateGo(fakeStateProvider)

	var n = 0
	function push(x) {
		return pushToQueue(function () {
			n++
			t.equal(x, n, n + ' === ' + x)
		})
	}
	
	var b = true
	function next() {
		var eventName = (b = !b) ? 'stateChangeEnd' : 'stateChangeError'
		fakeStateProvider.emit(eventName)
	}

	next()
	
	push(1)
	next()

	push(2)
	push(3)
	push(4)
	setInterval(next, 100).unref()

	setTimeout(push, 150, 5)
	setTimeout(push, 250, 6)
	setTimeout(t.end.bind(t), 650)
})
