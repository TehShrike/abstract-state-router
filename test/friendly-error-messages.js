import { test } from 'node:test'
import assert from 'node:assert'
import getTestState from './helpers/test-state-factory.js'

test(`friendly error message for missing state`, t => {
	const stateRouter = getTestState(t).stateRouter

	function shouldThrow() {
		stateRouter.addState()
	}
	assert.throws(shouldThrow, /state/, `Error message has the word 'state'`)
})

test(`friendly error message for missing name`, t => {
	const stateRouter = getTestState(t).stateRouter

	function shouldThrow() {
		stateRouter.addState({ template: `hello` })
	}
	assert.throws(shouldThrow, /name/, `Error message has the word 'name'`)
})

test(`friendly error message for missing template`, t => {
	const stateRouter = getTestState(t).stateRouter

	function shouldThrow() {
		stateRouter.addState({ name: `hello` })
	}
	assert.throws(shouldThrow, /template/, `Error message has the word 'template'`)
})

test(`name and template are the only required options`, async t => {
	const stateRouter = getTestState(t).stateRouter

	function failure(prefix) {
		return function(err) {
			assert.fail(`${prefix } ${ err ? err.message : `no message`}`)
		}
	}

	process.on(`uncaughtException`, failure(`uncaught`))
	stateRouter.on(`stateChangeError`, failure(`stateChangeError`))
	stateRouter.on(`stateError`, failure(`stateError`))

	stateRouter.addState({ name: `hello`, template: `hello` })
	stateRouter.go(`hello`)

	await new Promise(resolve => {
		setTimeout(() => {
			assert.ok(true, `ok`)
			resolve()
		}, 500)
	})
})
