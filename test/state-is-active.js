import { test } from 'node:test'
import assert from 'node:assert'
import getTestState from './helpers/test-state-factory.js'

test(`stateIsActive`, async t => {
	const stateRouter = getTestState(t).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent`,
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

	await new Promise(resolve => {
		stateRouter.on(`stateChangeEnd`, () => {
			assert.ok(stateRouter.stateIsActive(`parent`), `parent is active`)
			assert.ok(stateRouter.stateIsActive(`parent.child1`), `parent.child1 is active`)
			assert.ok(!stateRouter.stateIsActive(`parent.child2`), `parent.child2 is not active`)
			assert.ok(!stateRouter.stateIsActive(`not a real state`), `non-existant state is not active`)

			assert.ok(!stateRouter.stateIsActive(`parent.child1`, { butts: `no` }), `shouldn't match wuth butts=no`)
			assert.ok(stateRouter.stateIsActive(`parent.child1`, { butts: `yes` }), `should match with butts=yes`)

			resolve()
		})

		stateRouter.go(`parent.child1`, { butts: `yes` })
	})
})

test(`stateIsActive but states with that substring are not`, async t => {
	const stateRouter = getTestState(t).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent`,
	})

	stateRouter.addState({
		name: `parent-thing`,
		template: ``,
		route: `/parent-thing`,
	})

	stateRouter.addState({
		name: `parent.child`,
		template: ``,
		route: `/child`,
	})

	stateRouter.addState({
		name: `parent.child-thing`,
		template: ``,
		route: `/child-thing`,
	})

	await new Promise(resolve => {
		stateRouter.on(`stateChangeEnd`, () => {
			assert.ok(stateRouter.stateIsActive(`parent`), `parent is active`)
			assert.ok(!stateRouter.stateIsActive(`parent-thing`), `parent-thing is not active`)

			assert.ok(stateRouter.stateIsActive(`parent.child-thing`), `parent.child is active`)
			assert.ok(!stateRouter.stateIsActive(`parent.child`), `parent.child-thing is not active`)

			resolve()
		})

		stateRouter.go(`parent.child-thing`, { butts: `yes` })
	})
})

test(`stateIsActive compares parameters`, async t => {
	const stateRouter = getTestState(t).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent`,
	})

	stateRouter.addState({
		name: `parent.child`,
		template: ``,
		route: `/child`,
	})

	await new Promise(resolve => {
		stateRouter.on(`stateChangeEnd`, () => {
			assert.ok(stateRouter.stateIsActive(`parent.child`, { butts: `yes` }))
			assert.ok(!stateRouter.stateIsActive(`parent.child`, { butts: `no` }))
			resolve()
		})

		stateRouter.go(`parent.child`, { butts: `yes` })
	})
})

test(`null parameters passed to stateIsActive are equivalent to passing in nothing`, async t => {
	const stateRouter = getTestState(t).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent`,
	})

	stateRouter.addState({
		name: `parent.child`,
		template: ``,
		route: `/child`,
	})

	await new Promise(resolve => {
		stateRouter.on(`stateChangeEnd`, () => {
			assert.ok(stateRouter.stateIsActive(`parent.child`, null))
			assert.ok(stateRouter.stateIsActive(`parent`, null))

			resolve()
		})

		stateRouter.go(`parent.child`, { butts: `yes` })
	})
})

test(`stateIsActive coerces parameters to strings before comparing them to the querystring`, async t => {
	const stateRouter = getTestState(t).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent`,
	})

	stateRouter.addState({
		name: `parent.child`,
		template: ``,
		route: `/child`,
	})

	await new Promise(resolve => {
		stateRouter.on(`stateChangeEnd`, () => {
			assert.ok(stateRouter.stateIsActive(`parent.child`, { butts: `420` }))
			assert.ok(stateRouter.stateIsActive(`parent.child`, { butts: 420 }))
			assert.ok(!stateRouter.stateIsActive(`parent.child`, { butts: null }))
			resolve()
		})

		stateRouter.go(`parent.child`, { butts: 420 })
	})
})

test(`null state name passed to stateIsActive is equivalent to passing in the current state name`, async t => {
	const stateRouter = getTestState(t).stateRouter

	stateRouter.addState({
		name: `parent`,
		template: ``,
		route: `/parent`,
	})

	stateRouter.addState({
		name: `parent.child`,
		template: ``,
		route: `/child`,
	})

	await new Promise(resolve => {
		stateRouter.on(`stateChangeEnd`, () => {
			assert.ok(!stateRouter.stateIsActive(null, { butts: `no` }))
			assert.ok(stateRouter.stateIsActive(null, { butts: `yes` }))
			assert.ok(stateRouter.stateIsActive(null, null))

			resolve()
		})

		stateRouter.go(`parent.child`, { butts: `yes` })
	})
})
