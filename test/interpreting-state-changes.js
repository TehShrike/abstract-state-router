const test = require('tape-catch')

const interpretStateChange = require('../lib/state-change-logic')

test('State change logic', function(t) {
	function check(description, input, expected) {
		const output = interpretStateChange(input)

		t.deepEqual(output, expected, description)
	}

	check('only changing the grandchild', [{
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
	}], {
		destroy: [ 'app.main.tab1' ],
		change: [],
		create: [ 'app.main.tab2' ],
	})

	check('login to a nested state', [{
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
	}], {
		destroy: [ 'login' ],
		change: [],
		create: [ 'app', 'app.main', 'app.main.tab1' ],
	})

	check('a nested state to logout', [{
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
	}], {
		destroy: [ 'app', 'app.main', 'app.main.tab2' ],
		change: [],
		create: [ 'logout' ],
	})

	check('changing parameters but not the name', [{
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
	}], {
		destroy: [],
		change: [ 'app.main', 'app.main.tab1' ],
		create: [],
	})

	check('changing mid-level parameter and low-level name', [{
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
	}], {
		destroy: [ 'app.main.tab1' ],
		change: [ 'app.main' ],
		create: [ 'app.main.tab2' ],
	})

	check('changing highest-level parameter', [{
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
	}], {
		destroy: [],
		change: [ 'app', 'app.main', 'app.main.tab1' ],
		create: [],
	})

	t.end()
})
