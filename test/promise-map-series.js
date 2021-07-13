// Copied from https://github.com/joliss/promise-map-series/blob/master/test.js

const test = require(`tape-catch`)
const mapSeries = require(`../lib/promise-map-series`)

test(`mapSeries`, t => {
	t.test(`iterator is called in sequence for each item`, t => {
		t.plan(6)
		let seq = 0
		mapSeries([ 0, 1 ], item => {
			t.equal(seq, item)
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					t.equal(seq++, item)
					resolve(item === 0 ? `foo` : `bar`)
				}, 10)
			})
		})
			.then(results => {
				t.equal(seq, 2)
				t.deepEqual(results, [ `foo`, `bar` ])
			})
	})

	t.test(`is rejected on first rejection`, t => {
		t.plan(2)
		const errorObject = new Error(`rejected`)
		mapSeries([ 0, 1 ], item => {
			t.pass(`is called once`)
			throw errorObject
		})
			.then(() => {
				t.fail(`promise should be rejected`)
			}, err => {
				t.equal(err, errorObject)
			})
	})

	t.test(`passes index and array argument to iterator`, t => {
		t.plan(5)
		const arr = [ 42, 43 ]
		mapSeries(arr, (item, index, array) => {
			t.equal(item, index + 42)
			t.equal(array, arr)
		}).then(results => {
			t.deepEqual(results, [ undefined, undefined ])
		})
	})
})
