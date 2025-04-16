import { test } from 'node:test'
import assert from 'node:assert'
import getTestState from './helpers/test-state-factory.js'

test(`propertiesInRoute`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	const hashRouter = testState.hashRouter

	let timesActivatedCalled = 0
	stateRouter.addState({
		name: `only`,
		template: ``,
		route: `/something/:param/whatever`,
		activate(context) {
			timesActivatedCalled++

			if (timesActivatedCalled === 1) {
				assert.strictEqual(context.parameters.param, `firstTime`)
				hashRouter.go(`/something/secondTime/whatever`)
			} else {
				assert.strictEqual(context.parameters.param, `secondTime`)
				return Promise.resolve()
			}
		},
	})

	await new Promise(resolve => {
		stateRouter.go(`only`, { param: `firstTime` })

		// We need to wait for both activations to complete
		const checkInterval = setInterval(() => {
			if (timesActivatedCalled === 2) {
				clearInterval(checkInterval)
				resolve()
			}
		}, 50)
	})
})

test(`inherit parent's parameters`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter

	stateRouter.addState({
		name: `parent`,
		route: `/parent`,
		template: `parentTemplate`,
		querystringParameters: [ `parent` ],
	})

	stateRouter.addState({
		name: `parent.child1`,
		route: `/child1`,
		template: `child1Template`,
		querystringParameters: [ `child1` ],
		activate(context) {
			process.nextTick(() => {
				stateRouter.go(`parent.child2`, {
					moreSpecificArg: `yes`,
				}, { inherit: true })
			})
		},
	})

	await new Promise(resolve => {
		stateRouter.addState({
			name: `parent.child2`,
			route: `/child2`,
			template: `child2Template`,
			activate(context) {
				assert.strictEqual(context.parameters.parent, `initial parent`)
				assert.strictEqual(context.parameters.moreSpecificArg, `yes`)
				resolve()
			},
		})

		stateRouter.go(`parent.child1`, { parent: `initial parent` })
	})
})

test(`inherit generic parameters`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter

	stateRouter.addState({
		name: `parent`,
		route: `/parent`,
		template: `parentTemplate`,
	})

	stateRouter.addState({
		name: `parent.child1`,
		route: `/child1`,
		template: `child1Template`,
		querystringParameters: [ `child1` ],
		activate(context) {
			process.nextTick(() => {
				stateRouter.go(`parent.child2`, {}, { inherit: true })
			})
		},
	})

	await new Promise(resolve => {
		stateRouter.addState({
			name: `parent.child2`,
			route: `/child2`,
			template: `child2Template`,
			activate(context) {
				assert.strictEqual(context.parameters.parent, `initial parent`)
				resolve()
			},
		})

		stateRouter.go(`parent.child1`, { parent: `initial parent` })
	})
})

test(`can overwrite parameters when using inherit`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter

	stateRouter.addState({
		name: `parent`,
		route: `/parent`,
		template: `parentTemplate`,
	})

	stateRouter.addState({
		name: `parent.child1`,
		route: `/child1`,
		template: `child1Template`,
		querystringParameters: [ `child1` ],
		activate(context) {
			process.nextTick(() => {
				stateRouter.go(`parent.child2`, {
					parent: `new value`,
				}, { inherit: true })
			})
		},
	})

	await new Promise(resolve => {
		stateRouter.addState({
			name: `parent.child2`,
			route: `/child2`,
			template: `child2Template`,
			activate(context) {
				assert.strictEqual(context.parameters.parent, `new value`)
				assert.strictEqual(context.parameters.whatevs, `totally`)
				resolve()
			},
		})

		stateRouter.go(`parent.child1`, {
			parent: `initial parent`,
			whatevs: `totally`,
		})
	})
})

test(`inherit works with replace`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter

	stateRouter.addState({
		name: `parent`,
		route: `/parent`,
		template: `parentTemplate`,
	})

	stateRouter.addState({
		name: `parent.child1`,
		route: `/child1`,
		template: `child1Template`,
		querystringParameters: [ `child1` ],
		activate(context) {
			process.nextTick(() => {
				stateRouter.go(`parent.child2`, {
					parent: `new value`,
				}, { inherit: true, replace: true })
			})
		},
	})

	await new Promise(resolve => {
		stateRouter.addState({
			name: `parent.child2`,
			route: `/child2`,
			template: `child2Template`,
			activate(context) {
				assert.strictEqual(context.parameters.parent, `new value`)
				assert.strictEqual(context.parameters.whatevs, `totally`)
				resolve()
			},
		})

		stateRouter.go(`parent.child1`, {
			parent: `initial parent`,
			whatevs: `totally`,
		})
	})
})
