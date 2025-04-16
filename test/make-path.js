import { test } from 'node:test'
import assert from 'node:assert'
import qs from 'querystring'
import getTestState from './helpers/test-state-factory.js'

function basicRouterSetup(t, options) {
	const stateRouter = getTestState(t, null, options).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent`,
		querystringParameters: [ `thingy`, `thinger` ],
	})

	stateRouter.addState({
		name: `parent.child1`,
		template: ``,
		route: `/child1`,
	})

	stateRouter.addState({
		name: `parent.child2`,
		template: ``,
		route: `/child2`,
	})

	return stateRouter
}

test(`makePath builds a path and throws on non-existant state`, t => {
	const stateRouter = basicRouterSetup(t)

	assert.strictEqual(stateRouter.makePath(`parent.child1`, { param: `value` }), `#/parent/child1?param=value`)

	assert.throws(() => {
		stateRouter.makePath(`parent.doesnotexist`)
	}, /doesnotexist/)
})

test(`makePath respects the prefix option`, t => {
	const stateRouter = basicRouterSetup(t, {
		pathPrefix: ``,
	})

	assert.strictEqual(stateRouter.makePath(`parent.child1`, { thingy: `value` }), `/parent/child1?thingy=value`)
	assert.strictEqual(stateRouter.makePath(`parent`, { thingy: `value` }), `/parent?thingy=value`)
})

test(`makePath respects the inherit option`, async t => {
	const stateRouter = basicRouterSetup(t)

	function justTheQuerystring(str) {
		const match = /\?(.+)$/.exec(str)
		return qs.parse(match[1])
	}

	await new Promise(resolve => {
		stateRouter.on(`stateChangeEnd`, () => {
			let output = justTheQuerystring(stateRouter.makePath(`parent.child2`, { otherParameter: `other value` }, { inherit: true }))
			assert.strictEqual(output.originalParameter, `original value`)
			assert.strictEqual(output.otherParameter, `other value`)
			assert.strictEqual(Object.keys(output).length, 2)

			output = justTheQuerystring(stateRouter.makePath(`parent.child2`, { originalParameter: `new value` }, { inherit: true }))
			assert.strictEqual(output.originalParameter, `new value`)
			assert.strictEqual(Object.keys(output).length, 1)

			resolve()
		})

		stateRouter.go(`parent.child1`, {
			originalParameter: `original value`,
		})
	})
})

test(`makePath inheriting parameters from the route by the time the activate function is called`, async t => {
	const stateRouter = getTestState(t, null, {
		pathPrefix: ``,
	}).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent/:someParam/yarp`,
	})

	await new Promise(resolve => {
		stateRouter.addState({
			name: `parent.child1`,
			template: ``,
			route: `/child1`,
			activate(context) {
				assert.strictEqual(context.parameters.someParam, `totally`)

				const path = stateRouter.makePath(`parent.child2`, {}, {
					inherit: true,
				})

				assert.strictEqual(path, `/parent/totally/yarp/child2`, `Output path contains the route parameter`)
				resolve()
			},
		})
		stateRouter.addState({
			name: `parent.child2`,
			template: ``,
			route: `/child2`,
		})

		stateRouter.go(`parent.child1`, { someParam: `totally` })
	})
})

test(`makePath with falsey parameters`, t => {
	const stateRouter = getTestState(t, null, {
		pathPrefix: ``,
	}).stateRouter

	stateRouter.addState({
		name: `whatever`,
		template: ``,
		route: `/timer/:week(\\d+)/:day(\\d+)`,
	})

	const output = stateRouter.makePath(`whatever`, {
		week: 0,
		day: 0,
	})

	assert.strictEqual(output, `/timer/0/0`)
})

test(`makePath with null state name goes to the current state`, async t => {
	const stateRouter = basicRouterSetup(t)

	await new Promise(resolve => {
		stateRouter.on(`stateChangeEnd`, () => {
			const output = stateRouter.makePath(null, { thinger: `eh` })
			assert.strictEqual(output, `#/parent/child2?thinger=eh`)
			resolve()
		})

		stateRouter.go(`parent.child2`, { thinger: `whatsit` })
	})
})

test(`makePath with null state name throws an error if there is no current state`, t => {
	const stateRouter = basicRouterSetup(t)

	assert.throws(() => {
		stateRouter.makePath(null, { thinger: `eh` })
	}, /previous state/)
})
