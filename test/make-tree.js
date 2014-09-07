var test = require('tape')
var extend = require('extend')

var makeTree = require('../make-tree')

var TEST = [
	[['wat'], {}, {
		wat: {}
	}],
	[['wat', 'eh'], {}, {
		wat: {
			eh: {}
		}
	}],
	[['wat', 'eh'], {
		wat: {
			um: 'yes'
		}
	}, {
		wat: {
			um: 'yes',
			eh: {}
		}
	}],
	[['wat', 'eh', 'huh'], {
		wat: {
			um: 'really?',
			eh: 'gonna go away',
			yeah: {
				yup: 'sure'
			}
		},
		ok: {}
	}, {
		wat: {
			um: 'really?',
			eh: {
				huh: {}
			},
			yeah: {
				yup: 'sure'
			}
		},
		ok: {}
	}]
]

test('creating object hierarchy', function(t) {
	t.plan(TEST.length)
	TEST.forEach(function(testCase) {
		var input = testCase[0]
		var startingObject = extend(true, {}, testCase[1])
		var expectedOutput = testCase[2]
		var alteredObject = testCase[1]
		var output = makeTree(input, alteredObject)
		t.deepEqual(alteredObject, expectedOutput)
	})
	t.end()
})

test('output is the existing child', function(t) {
	var child = {}
	var input = { hi: { yes: child }}
	t.equal(makeTree(['hi', 'yes'], input), child)
	t.end()
})

test('output is the new child', function(t) {
	var input = {
		hi: {}
	}

	var child = makeTree(['hi', 'yes'], input)

	t.equal(input.hi.yes, child)
	t.end()
})
