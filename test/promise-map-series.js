// Copied from https://github.com/joliss/promise-map-series/blob/master/test.js

import { test } from 'node:test'
import assert from 'node:assert'
import mapSeries from '../lib/promise-map-series.js'

test(`mapSeries`, async t => {
	await t.test(`iterator is called in sequence for each item`, async t => {
		let seq = 0
		await mapSeries([ 0, 1 ], item => {
			assert.strictEqual(seq, item)
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					assert.strictEqual(seq++, item)
					resolve(item === 0 ? `foo` : `bar`)
				}, 10)
			})
		})
			.then(results => {
				assert.strictEqual(seq, 2)
				assert.deepStrictEqual(results, [ `foo`, `bar` ])
			})
	})

	await t.test(`is rejected on first rejection`, async t => {
		let callCount = 0
		const errorObject = new Error(`rejected`)
		await mapSeries([ 0, 1 ], item => {
			callCount++
			assert.strictEqual(callCount, 1, `is called once`)
			throw errorObject
		})
			.then(() => {
				assert.fail(`promise should be rejected`)
			}, err => {
				assert.strictEqual(err, errorObject)
			})
	})

	await t.test(`passes index and array argument to iterator`, async t => {
		const arr = [ 42, 43 ]
		await mapSeries(arr, (item, index, array) => {
			assert.strictEqual(item, index + 42)
			assert.strictEqual(array, arr)
		}).then(results => {
			assert.deepStrictEqual(results, [ undefined, undefined ])
		})
	})
})
