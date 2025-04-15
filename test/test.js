import { test } from 'node:test'
import assert from 'node:assert'
import assertingRendererFactory from './helpers/asserting-renderer-factory.js'
import getTestState from './helpers/test-state-factory.js'

test(`normal, error-less state activation flow for two states`, async t => {
	function basicTest(t) {
		const parentData = {}
		const childData = {}
		const parentTemplate = {}
		const childTemplate = {}
		const parentResolveContent = {
			parentProperty: `some string`,
		}
		const childResolveContent = {
			childProperty: `a different string`,
		}

		const renderer = assertingRendererFactory(t, [ parentTemplate, childTemplate ])
		const state = getTestState(t, renderer)
		const stateRouter = state.stateRouter
		const assertsBelow = 18
		const renderAsserts = renderer.expectedAssertions

		let parentResolveFinished = false
		let parentStateActivated = false
		let childResolveFinished = false

		stateRouter.addState({
			name: `rofl`,
			route: `/routeButt`,
			data: parentData,
			template: parentTemplate,
			resolve(data, parameters) {
				return new Promise(resolve => {
					assert.strictEqual(data, parentData, `got back the correct parent data object in the activate function`)
					assert.strictEqual(parameters.wat, `wut`, `got the parameter value in the parent resolve function`)
					setTimeout(() => {
						parentResolveFinished = true
						resolve(parentResolveContent)
					}, 200)
				})
			},
			querystringParameters: [ `wat` ],
			activate(context) {
				const domApi = context.domApi
				const data = context.data
				const parameters = context.parameters
				const content = context.content

				assert.strictEqual(parentStateActivated, false, `parent state hasn't been activated before`)
				parentStateActivated = true

				assert.strictEqual(parentResolveFinished, true, `Parent resolve was completed before the activate`)

				assert.strictEqual(domApi.template, parentTemplate, `got back the correct DOM API`)
				assert.strictEqual(data, parentData, `got back the correct data object in the activate function`)
				assert.strictEqual(content.parentProperty, parentResolveContent.parentProperty, `The parent activate function got the parent property from the resolve function object`)
				assert.strictEqual(content.childProperty, undefined, `No child resolve content visible to the parent`)
				assert.strictEqual(parameters.wat, `wut`, `got the parameter value in the parent's activate function`)
			},
		})

		stateRouter.addState({
			name: `rofl.copter`,
			route: `/lolcopter`,
			data: childData,
			template: childTemplate,
			resolve(data, parameters) {
				return new Promise(resolve => {
					assert.strictEqual(data, childData, `got back the correct child data object in the child resolve function`)
					assert.strictEqual(parameters.wat, `wut`, `got the parent's querystring value in the child resolve function`)
					setTimeout(() => {
						childResolveFinished = true
						resolve(childResolveContent)
					}, 100)
				})
			},
			activate(context) {
				const domApi = context.domApi
				const data = context.data
				const parameters = context.parameters
				const content = context.content

				assert.strictEqual(parentStateActivated, true, `Parent state was activated before the child state was`)
				assert.strictEqual(childResolveFinished, true, `Child resolve was completed before the activate`)

				assert.strictEqual(domApi.template, childTemplate, `got back the correct DOM API`)
				assert.strictEqual(data, childData, `Got back the correct data object`)
				assert.strictEqual(content.parentProperty, parentResolveContent.parentProperty, `The child activate function got the parent property from the resolve function object`)
				assert.strictEqual(content.childProperty, childResolveContent.childProperty, `The child activate function got the child property from the resolve function`)
				assert.strictEqual(parameters.wat, `wut`, `got the the parent's parameter value in the child's activate function`)
			},
		})

		return state
	}

	await t.test(`triggered with go()`, async t => {
		const state = basicTest(t)
		const stateRouter = state.stateRouter

		await new Promise(resolve => {
			stateRouter.on('stateChangeEnd', state => {
				if (state.name === 'rofl.copter') {
					resolve()
				}
			})

			stateRouter.go(`rofl.copter`, { wat: `wut` })
		})
	})

	await t.test(`triggered by the router`, async t => {
		const state = basicTest(t)
		const hashRouter = state.hashRouter
		const stateRouter = state.stateRouter

		await new Promise(resolve => {
			stateRouter.on('stateChangeEnd', state => {
				if (state.name === 'rofl.copter') {
					resolve()
				}
			})

			hashRouter.go(`/routeButt/lolcopter?wat=wut`)
		})
	})
})

test(`undefined data, querystring, and resolve function`, async t => {
	function basicTest(t) {
		const parentTemplate = {}

		const renderer = assertingRendererFactory(t, [ parentTemplate ])
		const state = getTestState(t, renderer)
		const stateRouter = state.stateRouter

		stateRouter.addState({
			name: `rofl`,
			route: `/routeButt`,
			template: parentTemplate,
			activate(context) {
				const data = context.data
				const parameters = context.parameters
				const content = context.content

				assert.strictEqual(typeof data, `undefined`, `data is undefined`)
				assert.strictEqual(parameters.wat, `wut`, `got the parameter value`)
				assert.strictEqual(Object.keys(content).length, 0, `No keys on the content object`)
			},
		})

		return state
	}

	await t.test(`triggered with go()`, async t => {
		const state = basicTest(t)
		const stateRouter = state.stateRouter

		await new Promise(resolve => {
			stateRouter.on('stateChangeEnd', state => {
				if (state.name === 'rofl') {
					resolve()
				}
			})

			stateRouter.go(`rofl`, { wat: `wut` })
		})
	})

	await t.test(`triggered by the router`, async t => {
		const state = basicTest(t)
		const hashRouter = state.hashRouter
		const stateRouter = state.stateRouter

		await new Promise(resolve => {
			stateRouter.on('stateChangeEnd', state => {
				if (state.name === 'rofl') {
					resolve()
				}
			})

			hashRouter.go(`/routeButt?wat=wut`)
		})
	})
})

test(`normal, error-less state activation flow for two states`, async t => {
	const parentData = {}
	const child1Data = {}
	const child2Data = {}
	const parentTemplate = {}
	const child1Template = {}
	const child2Template = {}
	const parentResolveContent = {
		parentProperty: `some string`,
	}
	const child1ResolveContent = {
		child1Property: `a different string`,
	}
	const child2ResolveContent = {
		child2Property: `whatever man`,
	}

	const renderer = assertingRendererFactory(t, [ parentTemplate, child1Template, child2Template ])
	const state = getTestState(t, renderer)
	const stateRouter = state.stateRouter

	let parentResolveCalled = false
	let parentStateActivated = false
	let child1ResolveCalled = false
	const child1Activated = false

	stateRouter.addState({
		name: `parent`,
		route: `/parent`,
		data: parentData,
		template: parentTemplate,
		resolve(data, parameters) {
			return new Promise(resolve => {
				assert.strictEqual(parentResolveCalled, false, `parent resolve function hasn't been called before`)
				parentResolveCalled = true
				setTimeout(() => resolve(parentResolveContent), 50)
			})
		},
		querystringParameters: [ `wat` ],
		activate(context) {
			assert.strictEqual(parentStateActivated, false, `parent state hasn't been activated before`)
			parentStateActivated = true
		},
	})

	stateRouter.addState({
		name: `parent.child1`,
		route: `/child1`,
		data: child1Data,
		template: child1Template,
		resolve(data, parameters) {
			return new Promise(resolve => {
				assert.strictEqual(child1ResolveCalled, false, `child1 resolve function hasn't been called before`)
				child1ResolveCalled = true

				setTimeout(() => resolve(child1ResolveContent), 50)
			})
		},
		activate(context) {
			assert.strictEqual(child1Activated, false, `child1 hasn't been activated before`)

			setTimeout(() => {
				stateRouter.go(`parent.child2`, { wat: `some value` })
			})
		},
	})

	let resolved = false
	await new Promise(resolve => {
		const timeout = setTimeout(() => {
			if (!resolved) {
				resolved = true
				resolve()
			}
		}, 1000)
		stateRouter.addState({
			name: `parent.child2`,
			route: `/child2`,
			data: child2Data,
			template: child2Template,
			resolve(data, parameters) {
				return new Promise(resolve => {
					assert.strictEqual(data, child2Data, `got back the correct child2 data object in the child2 resolve function`)
					assert.strictEqual(parameters.wat, `some value`, `got the parent's querystring value in the child2 resolve function`)

					setTimeout(() => resolve(child2ResolveContent), 50)
				})
			},
			activate(context) {
				assert.strictEqual(context.domApi.template, child2Template, `got back the correct DOM API`)
				assert.strictEqual(context.data, child2Data, `Got back the correct data object`)
				assert.strictEqual(context.content.parentProperty, parentResolveContent.parentProperty, `The child2 activate function got the parent property from the resolve function object`)
				assert.strictEqual(context.content.child2Property, child2ResolveContent.child2Property, `The child2 activate function got the child2 property from the resolve function`)
				assert.strictEqual(context.parameters.wat, `some value`, `got the the parent's parameter value in the child2's activate function`)
				resolve()
			},
		})

		stateRouter.go(`parent.child1`, { wat: `some value` })
	})
})

test(`resolve that returns a promise`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter

	let resolved = false
	await new Promise(resolve => {
		const timeout = setTimeout(() => {
			if (!resolved) {
				resolved = true
				resolve()
			}
		}, 1000)
		stateRouter.addState({
			name: `some-state`,
			template: null,
			resolve() {
				return new Promise((resolvePromise, reject) => {
					resolvePromise({
						value: `this is it!`,
					})
				})
			},
			activate(context) {
				assert.strictEqual(context.content.value, `this is it!`)
				resolve()
			},
		})

		stateRouter.go(`some-state`)
	})
})

test(`render fn receives parameters`, async t => {
	const stateRouter = getTestState(t, () => ({
		render(context) {
			assert.deepEqual(context.parameters, { foo: `abc` })
		},
	})).stateRouter

	let resolved = false
	await new Promise(resolve => {
		const timeout = setTimeout(() => {
			if (!resolved) {
				resolved = true
				resolve()
			}
		}, 1000)
		stateRouter.addState({
			name: `x`,
			route: `/x/:foo`,
			template: ``,
		})

		stateRouter.on('stateChangeEnd', state => {
			if (state.name === 'x') {
				resolve()
			}
		})

		stateRouter.go(`x`, { foo: `abc` })
	})
})

test(`go uses current state when no stateName is provided`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	let firstActivateDidHappen = false

	let resolved = false
	await new Promise(resolve => {
		const timeout = setTimeout(() => {
			if (!resolved) {
				resolved = true
				resolve()
			}
		}, 1000)
		stateRouter.addState({
			name: `some-state`,
			template: ``,
			route: `someState`,
			querystringParameters: [ `poop` ],
			activate(context) {
				if (firstActivateDidHappen) {
					assert.deepEqual(context.parameters, { poop: `wet` })
					resolve()
				} else {
					firstActivateDidHappen = true
					process.nextTick(() => {
						stateRouter.go(null, { poop: `wet` })
					})
				}
			},
		})

		stateRouter.go(`some-state`, { poop: `dry` })
	})
})

test(`go uses current state when no stateName is provided with 2 parameters`, async t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	let firstActivateDidHappen = false

	await new Promise(resolve => {
		stateRouter.addState({
			name: `some-state`,
			template: ``,
			route: `someState`,
			querystringParameters: [ `poop` ],
			activate(context) {
				if (firstActivateDidHappen) {
					assert.deepEqual(context.parameters, { poop: `wet` })
					resolve()
				} else {
					firstActivateDidHappen = true
					process.nextTick(() => {
						stateRouter.go(null, { poop: `wet` }, { replace: true })
					})
				}
			},
		})

		stateRouter.go(`some-state`, { poop: `dry` }, { replace: true })
	})
})

test(`calling redirect with no stateName in resolve should use current state`, async t => {
	const stateRouter = getTestState(t).stateRouter
	let isFirstResolve = true

	await new Promise(resolve => {
		// This state is just so we have a "current state" we can get to first
		stateRouter.addState({
			name: `first`,
			route: `FRIST`,
			template: ``,
			activate(context) {
				process.nextTick(() => {
					stateRouter.go(`second`, { wut: `fart` })
				})
			},
		})

		stateRouter.addState({
			name: `second`,
			route: `SCONDE`,
			template: ``,
			querystringParameters: [ `wut` ],
			resolve(data, parameters) {
				return new Promise((resolvePromise, reject) => {
					if (isFirstResolve) {
						isFirstResolve = false
						reject({
							redirectTo: {
								name: null,
								params: {
									wut: `butt`,
								},
							},
						})
					} else {
						resolvePromise()
					}
				})
			},
			activate(context) {
				// this should never get hit the first time since redirect gets called in resolve
				assert.strictEqual(context.parameters.wut, `butt`)
				resolve()
			},
		})

		stateRouter.go(`first`)
	})
})
