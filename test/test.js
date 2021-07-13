const test = require(`tape-catch`)
const assertingRendererFactory = require(`./helpers/asserting-renderer-factory`)
const getTestState = require(`./helpers/test-state-factory`)

test(`normal, error-less state activation flow for two states`, t => {
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

		t.plan(assertsBelow + renderAsserts)

		let parentResolveFinished = false
		let parentStateActivated = false
		let childResolveFinished = false

		stateRouter.addState({
			name: `rofl`,
			route: `/routeButt`,
			data: parentData,
			template: parentTemplate,
			resolve(data, parameters, cb) {
				t.equal(data, parentData, `got back the correct parent data object in the activate function`)
				t.equal(parameters.wat, `wut`, `got the parameter value in the parent resolve function`)
				setTimeout(() => {
					parentResolveFinished = true
					cb(null, parentResolveContent)
				}, 200)
			},
			querystringParameters: [ `wat` ],
			activate(context) {
				const domApi = context.domApi
				const data = context.data
				const parameters = context.parameters
				const content = context.content

				t.notOk(parentStateActivated, `parent state hasn't been activated before`)
				parentStateActivated = true

				t.ok(parentResolveFinished, `Parent resolve was completed before the activate`)

				t.equal(domApi.template, parentTemplate, `got back the correct DOM API`)
				t.equal(data, parentData, `got back the correct data object in the activate function`)
				t.equal(content.parentProperty, parentResolveContent.parentProperty, `The parent activate function got the parent property from the resolve function object`)
				t.notOk(content.childProperty, `No child resolve content visible to the parent`)
				t.equal(parameters.wat, `wut`, `got the parameter value in the parent's activate function`)
			},
		})

		stateRouter.addState({
			name: `rofl.copter`,
			route: `/lolcopter`,
			data: childData,
			template: childTemplate,
			resolve(data, parameters, cb) {
				t.equal(data, childData, `got back the correct child data object in the child resolve function`)
				t.equal(parameters.wat, `wut`, `got the parent's querystring value in the child resolve function`)
				setTimeout(() => {
					childResolveFinished = true
					cb(null, childResolveContent)
				}, 100)
			},
			activate(context) {
				const domApi = context.domApi
				const data = context.data
				const parameters = context.parameters
				const content = context.content

				t.ok(parentStateActivated, `Parent state was activated before the child state was`)
				t.ok(childResolveFinished, `Child resolve was completed before the activate`)

				t.equal(domApi.template, childTemplate, `got back the correct DOM API`)
				t.equal(data, childData, `Got back the correct data object`)
				t.equal(content.parentProperty, parentResolveContent.parentProperty, `The child activate function got the parent property from the resolve function object`)
				t.equal(content.childProperty, childResolveContent.childProperty, `The child activate function got the child property from the resolve function`)
				t.equal(parameters.wat, `wut`, `got the the parent's parameter value in the child's activate function`)

				t.end()
			},
		})

		return state
	}

	t.test(`triggered with go()`, t => {
		const stateRouter = basicTest(t).stateRouter
		stateRouter.go(`rofl.copter`, { wat: `wut` })
	})

	t.test(`triggered by the router`, t => {
		const hashRouter = basicTest(t).hashRouter
		hashRouter.go(`/routeButt/lolcopter?wat=wut`)
	})
})


test(`undefined data, querystring, and resolve function`, t => {
	function basicTest(t) {
		const parentTemplate = {}

		const renderer = assertingRendererFactory(t, [ parentTemplate ])
		const state = getTestState(t, renderer)
		const assertsBelow = 3

		t.plan(assertsBelow + renderer.expectedAssertions)

		state.stateRouter.addState({
			name: `rofl`,
			route: `/routeButt`,
			template: parentTemplate,
			activate(context) {
				const data = context.data
				const parameters = context.parameters
				const content = context.content

				t.equal(typeof data, `undefined`, `data is undefined`)
				t.equal(parameters.wat, `wut`, `got the parameter value`)
				t.equal(Object.keys(content).length, 0, `No keys on the content object`)
				t.end()
			},
		})

		return state
	}

	t.test(`triggered with go()`, t => {
		const stateRouter = basicTest(t).stateRouter
		stateRouter.go(`rofl`, { wat: `wut` })
	})

	t.test(`triggered by the router`, t => {
		const hashRouter = basicTest(t).hashRouter
		hashRouter.go(`/routeButt?wat=wut`)
	})
})

test(`normal, error-less state activation flow for two states`, t => {
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
	const assertsBelow = 11

	t.plan(assertsBelow + renderer.expectedAssertions)

	let parentResolveCalled = false
	let parentStateActivated = false
	let child1ResolveCalled = false
	const child1Activated = false

	stateRouter.addState({
		name: `parent`,
		route: `/parent`,
		data: parentData,
		template: parentTemplate,
		resolve(data, parameters, cb) {
			t.notOk(parentResolveCalled, `parent resolve function hasn't been called before`)
			parentResolveCalled = true
			setTimeout(() => {
				cb(null, parentResolveContent)
			}, 50)
		},
		querystringParameters: [ `wat` ],
		activate(context) {
			t.notOk(parentStateActivated, `parent state hasn't been activated before`)
			parentStateActivated = true
		},
	})

	stateRouter.addState({
		name: `parent.child1`,
		route: `/child1`,
		data: child1Data,
		template: child1Template,
		resolve(data, parameters, cb) {
			t.notOk(child1ResolveCalled, `child1 resolve function hasn't been called before`)
			child1ResolveCalled = true

			setTimeout(() => {
				cb(null, child1ResolveContent)
			}, 50)
		},
		activate(context) {
			t.notOk(child1Activated, `child1 hasn't been activated before`)

			setTimeout(() => {
				stateRouter.go(`parent.child2`, { wat: `some value` })
			})
		},
	})

	stateRouter.addState({
		name: `parent.child2`,
		route: `/child2`,
		data: child2Data,
		template: child2Template,
		resolve(data, parameters, cb) {
			t.equal(data, child2Data, `got back the correct child2 data object in the child2 resolve function`)
			t.equal(parameters.wat, `some value`, `got the parent's querystring value in the child2 resolve function`)

			setTimeout(() => {
				cb(null, child2ResolveContent)
			}, 50)
		},
		activate(context) {
			t.equal(context.domApi.template, child2Template, `got back the correct DOM API`)
			t.equal(context.data, child2Data, `Got back the correct data object`)
			t.equal(context.content.parentProperty, parentResolveContent.parentProperty, `The child2 activate function got the parent property from the resolve function object`)
			t.equal(context.content.child2Property, child2ResolveContent.child2Property, `The child2 activate function got the child2 property from the resolve function`)
			t.equal(context.parameters.wat, `some value`, `got the the parent's parameter value in the child2's activate function`)

			t.end()
		},
	})

	stateRouter.go(`parent.child1`, { wat: `some value` })
})

test(`resolve that returns a promise`, t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter

	t.plan(1)

	stateRouter.addState({
		name: `some-state`,
		template: null,
		resolve() {
			return new Promise((resolve, reject) => {
				resolve({
					value: `this is it!`,
				})
			})
		},
		activate(context) {
			t.equal(context.content.value, `this is it!`)
			t.end()
		},
	})

	stateRouter.go(`some-state`)
})

test(`render fn receives parameters`, t => {
	t.plan(1)
	const stateRouter = getTestState(t, () => ({
		render(context) {
			t.deepEqual(context.parameters, { foo: `abc` })
		},
	})).stateRouter
	stateRouter.addState({
		name: `x`,
		route: `/x/:foo`,
		template: ``,
	})
	stateRouter.go(`x`, { foo: `abc` })
})

test(`reset fn receives parameters`, t => {
	t.plan(1)
	const stateRouter = getTestState(t, () => ({
		render(context, cb) {
			cb()
		},
		reset(context) {
			t.deepEqual(context.parameters, { foo: `def` })
		},
	})).stateRouter
	stateRouter.addState({
		name: `x`,
		route: `/x/:foo`,
		template: ``,
	})
	stateRouter.on(`stateChangeEnd`, () => {
		stateRouter.go(`x`, { foo: `def` })
	})
	stateRouter.go(`x`, { foo: `abc` })
})

test(`go uses current state when no stateName is provided`, t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	let firstActivateDidHappen = false

	t.plan(1)

	stateRouter.addState({
		name: `some-state`,
		template: ``,
		route: `someState`,
		querystringParameters: [ `poop` ],
		activate(context) {
			if (firstActivateDidHappen) {
				t.deepEqual(context.parameters, { poop: `wet` })
				t.end()
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

test(`go uses current state when no stateName is provided with 2 parameters`, t => {
	const testState = getTestState(t)
	const stateRouter = testState.stateRouter
	let firstActivateDidHappen = false

	t.plan(1)

	stateRouter.addState({
		name: `some-state`,
		template: ``,
		route: `someState`,
		querystringParameters: [ `poop` ],
		activate(context) {
			if (firstActivateDidHappen) {
				t.deepEqual(context.parameters, { poop: `wet` })
				t.end()
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

test(`calling redirect with no stateName in resolve should use current state`, t => {
	t.plan(1)
	const stateRouter = getTestState(t).stateRouter
	let isFirstResolve = true

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
		resolve(data, parameters, cb) {
			if (isFirstResolve) {
				isFirstResolve = false
				cb.redirect(null, { wut: `butt` })
			} else {
				cb()
			}
		},
		activate(context) {
			// this should never get hit the first time since redirect gets called in resolve
			t.equal(context.parameters.wut, `butt`)
			t.end()
		},
	})

	stateRouter.go(`first`)
})
