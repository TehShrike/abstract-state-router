import { test } from 'node:test'
import assert from 'node:assert'
import getTestState from './helpers/test-state-factory.js'

test(`All dom functions called in order`, async t => {
	const actions = []

	function makeRenderer() {
		return {
			render: function render(context) {
				const element = context.element
				const template = context.template
				actions.push(`render ${ template } on ${ element }`)
				return Promise.resolve(template)
			},
			reset: function reset(context) {
				actions.push(`reset ${ context.domApi }`)
				return Promise.resolve()
			},
			destroy: function destroy(renderedTemplateApi) {
				actions.push(`destroy ${ renderedTemplateApi }`)
				return Promise.resolve()
			},
			getChildElement: function getChildElement(renderedTemplateApi) {
				actions.push(`getChild ${ renderedTemplateApi }`)
				return Promise.resolve(`${renderedTemplateApi } child`)
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

	await new Promise(resolve => {
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
					assert.strictEqual(actions[index], planned, `Action ${index} should be "${planned}"`)
				})
				resolve()
			},
		})

		state.stateRouter.go(`top.first`)
	})
})
