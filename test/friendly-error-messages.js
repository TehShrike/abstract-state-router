import test from 'tape-catch'
import getTestState from './helpers/test-state-factory.js'

test(`friendly error message for missing state`, t => {
	const stateRouter = getTestState(t).stateRouter
	t.plan(1)

	function shouldThrow() {
		stateRouter.addState()
	}
	t.throws(shouldThrow, /state/, `Error message has the word 'state'`)

	t.end()
})

test(`friendly error message for missing name`, t => {
	const stateRouter = getTestState(t).stateRouter
	t.plan(1)

	function shouldThrow() {
		stateRouter.addState({ template: `hello` })
	}
	t.throws(shouldThrow, /name/, `Error message has the word 'name'`)

	t.end()
})

test(`friendly error message for missing template`, t => {
	const stateRouter = getTestState(t).stateRouter
	t.plan(1)

	function shouldThrow() {
		stateRouter.addState({ name: `hello` })
	}
	t.throws(shouldThrow, /template/, `Error message has the word 'template'`)

	t.end()
})

test(`name and template are the only required options`, t => {
	const stateRouter = getTestState(t).stateRouter
	t.plan(1)

	function failure(prefix) {
		return function(err) {
			t.fail(`${prefix } ${ err ? err.message : `no message`}`)
		}
	}

	process.on(`uncaughtException`, failure(`uncaught`))
	stateRouter.on(`stateChangeError`, failure(`stateChangeError`))
	stateRouter.on(`stateError`, failure(`stateError`))

	stateRouter.addState({ name: `hello`, template: `hello` })
	stateRouter.go(`hello`)

	setTimeout(() => {
		t.pass(`ok`)
		t.end()
	}, 500)
})
