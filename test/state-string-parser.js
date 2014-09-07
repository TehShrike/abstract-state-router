var test = require('tape')
var parse = require('../state-string-parser')

function testParsing(t, input, output) {
	//	console.log(t, t.deepEqual, parse)
	t.deepEqual(parse(input), output, input + ' produces ' + output.length + ' results')
}

var TESTS = [
	['butts', ['butts']],
	['butts.lol', ['butts', 'lol']],
	['butts rofl.wat.ok', ['butts rofl', 'wat', 'ok']]
]

test('state string parser', function(t) {
	t.plan(TESTS.length)
	TESTS.forEach(function(ary) {
		testParsing(t, ary[0], ary[1])
	})
})
