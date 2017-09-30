const test = require('tape-catch')
const getTestState = require('./helpers/test-state-factory')

test('friendly error message for missing state', function(t) {
	const stateRouter = getTestState(t).stateRouter
	t.plan(1)

	function shouldThrow() {
		stateRouter.addState()
	}
	t.throws(shouldThrow, /state/, 'Error message has the word \'state\'')

	t.end()
})

test('friendly error message for missing name', function(t) {
	const stateRouter = getTestState(t).stateRouter
	t.plan(1)

	function shouldThrow() {
		stateRouter.addState({ template: 'hello' })
	}
	t.throws(shouldThrow, /name/, 'Error message has the word \'name\'')

	t.end()
})

test('friendly error message for missing template', function(t) {
	const stateRouter = getTestState(t).stateRouter
	t.plan(1)

	function shouldThrow() {
		stateRouter.addState({ name: 'hello' })
	}
	t.throws(shouldThrow, /template/, 'Error message has the word \'template\'')

	t.end()
})

test('name and template are the only required options', function(t) {
	const stateRouter = getTestState(t).stateRouter
	t.plan(1)

	function failure(prefix) {
		return function(err) {
			t.fail(prefix + ' ' + (err ? err.message : 'no message'))
		}
	}

	process.on('uncaughtException', failure('uncaught'))
	stateRouter.on('stateChangeError', failure('stateChangeError'))
	stateRouter.on('stateError', failure('stateError'))

	stateRouter.addState({ name: 'hello', template: 'hello' })
	stateRouter.go('hello')

	setTimeout(function() {
		t.pass('ok')
		t.end()
	}, 500)
})
