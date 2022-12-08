const test = require(`tape-catch`)
const getTestState = require(`./helpers/test-state-factory`)

test(`All dom functions called in order`, t => {
	const actions = []

	function makeRenderer() {
		return {
			render: function render(context, cb) {
				const element = context.element
				const template = context.template
				actions.push(`render ${ template } on ${ element }`)
				cb(null, template)
			},
			reset: function reset(context, cb) {
				actions.push(`reset ${ context.domApi }`)
				cb()
			},
			destroy: function destroy(renderedTemplateApi, cb) {
				actions.push(`destroy ${ renderedTemplateApi }`)
				cb()
			},
			getChildElement: function getChildElement(renderedTemplateApi, cb) {
				actions.push(`getChild ${ renderedTemplateApi }`)
				cb(null, renderedTemplateApi + ` child`)
			},
		}
	}

	const state = getTestState(t, makeRenderer)

	const expectedActions = [
		`render topTemplate on body`,
		`getChild topTemplate`,
		`render topFirstTemplate on topTemplate child`,
		`activate top`,
		`activate top.first`,
		`destroy topFirstTemplate`,
		`destroy topTemplate`,
		`render topTemplate on body`,
		`getChild topTemplate`,
		`render topSecondTemplate on topTemplate child`,
		`activate top`,
		`activate top.second`,
	]

	t.plan(expectedActions.length)

	state.stateRouter.addState({
		name: `top`,
		template: `topTemplate`,
		querystringParameters: [ `myFancyParam` ],
		activate() {
			actions.push(`activate top`)
		},
	})

	state.stateRouter.addState({
		name: `top.first`,
		template: `topFirstTemplate`,
		route: `/first`,
		activate() {
			actions.push(`activate top.first`)
			state.stateRouter.go(`top.second`, {
				myFancyParam: `groovy dude`,
			})
		},
	})

	state.stateRouter.addState({
		name: `top.second`,
		template: `topSecondTemplate`,
		route: `/second`,
		activate() {
			actions.push(`activate top.second`)
			expectedActions.forEach((planned, index) => {
				t.equal(actions[index], planned, `Action ${index} should be "${planned}"`)
			})
			t.end()
		},
	})

	state.stateRouter.go(`top.first`)
})
