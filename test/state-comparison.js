var test = require('tape')
var StateState = require('../state-state.js')
var stateComparison = require('../state-comparison.js')

function simpleState(name, querystringParameters) {
	return {
		name: name,
		querystringParameters: querystringParameters
	}
}

function setup() {
	var stateContainer = new StateState()
	var states = [
		simpleState('app', ['appParam1']),
		simpleState('app.main', ['main1']),
		simpleState('app.main.tab1', ['main1', 'main2']),
		simpleState('app.main.tab2', ['main2', 'main3']),
		simpleState('login'),
		simpleState('logout')
	]

	states.forEach(function(state) {
		stateContainer.add(state.name, state)
	})

	return stateComparison(stateContainer)
}

function compareAllElements(t, expected, result) {
	t.equal(result.length, expected.length, 'Correct number of items in the result array')

	expected.forEach(function(obj, index) {
		t.deepEqual(obj, result[index], 'element ' + index + ' is correct')
	})
}

test('only changing the grandchild', function(t) {
	var results = setup()('app.main.tab1', {}, 'app.main.tab2', {})

	compareAllElements(t, [{
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'app'
	}, {
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app.main',
		nameAfter: 'app.main'
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main.tab1',
		nameAfter: 'app.main.tab2'
	}], results)


	t.end()
})

test('login to a nested state', function(t) {
	var results = setup()('login', {}, 'app.main.tab1', {})

		compareAllElements(t, [{
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'login',
		nameAfter: 'app'
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: undefined,
		nameAfter: 'app.main'
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: undefined,
		nameAfter: 'app.main.tab1'
	}], results)

	t.end()
})

test('a nested state to logout', function(t) {
	var results = setup()('app.main.tab2', {}, 'logout', {})

	compareAllElements(t, [{
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'logout'
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main',
		nameAfter: undefined
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main.tab2',
		nameAfter: undefined
	}], results)

	t.end()
})

test('changing parameters but not the name', function(t) {
	var results = setup()('app.main.tab1', { main1: 'first' }, 'app.main.tab1', { main1: 'second' })

	compareAllElements(t, [{
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'app'
	}, {
		stateNameChanged: false,
		stateParametersChanged: true,
		nameBefore: 'app.main',
		nameAfter: 'app.main'
	}, {
		stateNameChanged: false,
		stateParametersChanged: true,
		nameBefore: 'app.main.tab1',
		nameAfter: 'app.main.tab1'
	}], results)


	t.end()
})

test('changing name but not parameters', function(t) {
	var results = setup()('app.main.tab1', { main2: 'no change', doesntMatter: 'lol' },
		'app.main.tab2', { main2: 'no change', doesntMatter: 'butts' })

	compareAllElements(t, [{
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'app'
	}, {
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app.main',
		nameAfter: 'app.main'
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main.tab1',
		nameAfter: 'app.main.tab2'
	}], results)

	t.end()
})

test('changing mid-level parameter and low-level name', function(t) {
	var results = setup()('app.main.tab1', { main1: 'will change', main2: 'no change' },
		'app.main.tab2', { main1: 'changed', main2: 'no change' })

	compareAllElements(t, [{
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app',
		nameAfter: 'app'
	}, {
		stateNameChanged: false,
		stateParametersChanged: true,
		nameBefore: 'app.main',
		nameAfter: 'app.main'
	}, {
		stateNameChanged: true,
		stateParametersChanged: false,
		nameBefore: 'app.main.tab1',
		nameAfter: 'app.main.tab2'
	}], results)

	t.end()
})

test('changing highest-level parameter', function(t) {
	var results = setup()('app.main.tab1', { appParam1: 'will change', main2: 'no change' },
		'app.main.tab1', { appParam1: 'changed', main2: 'no change' })

	compareAllElements(t, [{
		stateNameChanged: false,
		stateParametersChanged: true,
		nameBefore: 'app',
		nameAfter: 'app'
	}, {
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app.main',
		nameAfter: 'app.main'
	}, {
		stateNameChanged: false,
		stateParametersChanged: false,
		nameBefore: 'app.main.tab1',
		nameAfter: 'app.main.tab1'
	}], results)

	t.end()
})
