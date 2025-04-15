import { test } from 'node:test'
import assert from 'node:assert'
import parse from '../lib/state-string-parser.js'

function testParsing(t, input, output) {
	assert.deepStrictEqual(parse(input), output, `${ input } produces ${ output.length } results`)
}

const TESTS = [
	[ `butts`, [ `butts` ] ],
	[ `butts.lol`, [ `butts`, `butts.lol` ] ],
	[ `butts rofl.wat.ok`, [ `butts rofl`, `butts rofl.wat`, `butts rofl.wat.ok` ] ],
]

test(`state string parser`, t => {
	TESTS.forEach(ary => testParsing(t, ary[0], ary[1]))
})
