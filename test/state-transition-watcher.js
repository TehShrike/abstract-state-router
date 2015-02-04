var test = require('tape')
var EventEmitter = require('events').EventEmitter
var StateTransitionWatcher = require('../state-transition-watcher')


test('state transition watcher', function(t) {
	var fakeStateProvider = new EventEmitter()
	var isTransitioning = StateTransitionWatcher(fakeStateProvider)

	;[
		{ eventName: 'construction',         expect: false },
		{ eventName: 'stateChangeStart',     expect: true  },
		{ eventName: 'stateChangeEnd',       expect: false },
		{ eventName: 'stateChangeStart',     expect: true  },
		{ eventName: 'stateChangeError',     expect: false },
		{ eventName: 'stateChangeEnd',       expect: false },
		{ eventName: 'stateChangeAttempt',   expect: true  },
		{ eventName: 'stateChangeError',     expect: false },
		{ eventName: 'stateChangeAttempt',   expect: true  },
		{ eventName: 'stateChangeCancelled', expect: false },
		{ eventName: 'stateChangeStart',     expect: true  },
		{ eventName: 'stateChangeStart',     expect: true  },
		{ eventName: 'stateChangeEnd',       expect: false },
		{ eventName: 'stateChangeEnd',       expect: false }
	].forEach(function (attempt) {
		fakeStateProvider.emit(attempt.eventName)
		var msg = 'After \'' + attempt.eventName + '\', the state is ' +
			(attempt.expect ? '' : 'not ') + 'transitioning.'
		t.equal(isTransitioning(), attempt.expect, msg)
	})

	t.end()
})
