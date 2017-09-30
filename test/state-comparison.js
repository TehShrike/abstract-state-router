const test = require('tape-catch')
const StateState = require('../lib/state-state.js')
const stateComparison = require('../lib/state-comparison.js')

function simpleState(name, querystringParameters, route = '') {
	return {
		name,
		querystringParameters,
		route,
	}
}

function setup() {
	const stateContainer = new StateState()
	const states = [
		simpleState('app', [ 'appParam1' ]),
		simpleState('app.main', [ 'main1' ], '/:routeParam'),
		simpleState('app.main.tab1', [ 'main1', 'main2' ]),
		simpleState('app.main.tab2', [ 'main2', 'main3' ]),
		simpleState('login'),
		simpleState('logout'),
	]

	states.forEach(state => stateContainer.add(state.name, state))

	return stateComparison(stateContainer)
}

function compareAllElements(t, expected, result) {
	t.equal(result.length, expected.length, 'Correct number of items in the result array')

	expected.forEach(function(obj, index) {
		t.deepEqual(obj, result[index], 'element ' + index + ' is correct')
	})
}

test('only changing the grandchild', t => {
	const results = setup()({
		originalState: 'app.main.tab1',
		originalParameters: {},
		newState: 'app.main.tab2',
		newParameters: {},
	})

	compareAllElements(t, [{
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'app',
	}, {
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app.main',
		nameAfter: 'app.main',
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main.tab1',
		nameAfter: 'app.main.tab2',
	}], results)


	t.end()
})

test('login to a nested state', t => {
	const results = setup()({
		originalState: 'login',
		originalParameters: {},
		newState: 'app.main.tab1',
		newParameters: {},
	})

	compareAllElements(t, [{
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'login',
		nameAfter: 'app',
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: undefined,
		nameAfter: 'app.main',
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: undefined,
		nameAfter: 'app.main.tab1',
	}], results)

	t.end()
})

test('a nested state to logout', t => {
	const results = setup()({
		originalState: 'app.main.tab2',
		originalParameters: {},
		newState: 'logout',
		newParameters: {},
	})

	compareAllElements(t, [{
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'logout',
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main',
		nameAfter: undefined,
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main.tab2',
		nameAfter: undefined,
	}], results)

	t.end()
})

test('changing parameters but not the name', t => {
	const results = setup()({
		originalState: 'app.main.tab1',
		originalParameters: { main1: 'first' },
		newState: 'app.main.tab1',
		newParameters: { main1: 'second' },
	})

	compareAllElements(t, [{
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'app',
	}, {
		stateNameChanged: false,
		stateParametersChanged: true,
		nameBefore: 'app.main',
		nameAfter: 'app.main',
	}, {
		stateNameChanged: false,
		stateParametersChanged: true,
		nameBefore: 'app.main.tab1',
		nameAfter: 'app.main.tab1',
	}], results)


	t.end()
})

test('changing name but not parameters', t => {
	const results = setup()({
		originalState: 'app.main.tab1',
		originalParameters: { main2: 'no change', doesntMatter: 'lol' },
		newState: 'app.main.tab2',
		newParameters: { main2: 'no change', doesntMatter: 'butts' },
	})

	compareAllElements(t, [{
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'app',
	}, {
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app.main',
		nameAfter: 'app.main',
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main.tab1',
		nameAfter: 'app.main.tab2',
	}], results)

	t.end()
})

test('changing mid-level parameter and low-level name', t => {
	const results = setup()({
		originalState: 'app.main.tab1',
		originalParameters: { main1: 'will change', main2: 'no change' },
		newState: 'app.main.tab2',
		newParameters: { main1: 'changed', main2: 'no change' },
	})

	compareAllElements(t, [{
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'app',
	}, {
		stateNameChanged: false,
		stateParametersChanged: true,
		nameBefore: 'app.main',
		nameAfter: 'app.main',
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main.tab1',
		nameAfter: 'app.main.tab2',
	}], results)

	t.end()
})

test('changing highest-level parameter', t => {
	const results = setup()({
		originalState: 'app.main.tab1',
		originalParameters: { appParam1: 'will change', main2: 'no change' },
		newState: 'app.main.tab1',
		newParameters: { appParam1: 'changed', main2: 'no change' },
	})

	compareAllElements(t, [{
		stateNameChanged: false,
		stateParametersChanged: true,
		nameBefore: 'app',
		nameAfter: 'app',
	}, {
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app.main',
		nameAfter: 'app.main',
	}, {
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app.main.tab1',
		nameAfter: 'app.main.tab1',
	}], results)

	t.end()
})

test('changing from app.main.tab1 to just main', t => {
	const results = setup()({
		originalState: 'app.main.tab1',
		originalParameters: { main1: 'wut' },
		newState: 'app',
		newParameters: {},
	})

	compareAllElements(t, [{
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'app',
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main',
		nameAfter: undefined,
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main.tab1',
		nameAfter: undefined,
	}], results)

	t.end()
})

test('changing states by modifying only a route parameter', t => {
	const compare = setup()

	const expected = [{
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'app',
	}, {
		stateNameChanged: false,
		stateParametersChanged: true,
		nameBefore: 'app.main',
		nameAfter: 'app.main',
	}]

	compareAllElements(t, expected, compare({
		originalState: 'app.main',
		originalParameters: { main1: 'nothing' },
		newState: 'app.main',
		newParameters: { main1: 'nothing', routeParam: 'something-new' },
	}))

	compareAllElements(t, expected, compare({
		originalState: 'app.main',
		originalParameters: { routeParam: 'something' },
		newState: 'app.main',
		newParameters: { routeParam: 'something-new' },
	}))


	t.end()
})
