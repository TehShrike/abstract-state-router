import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import visualizer from 'rollup-plugin-visualizer'

export default {
	input: `./index.js`,
	output: [
		{
			file: `./bundle.js`,
			format: `es`,
			sourcemap: true,
		},
	],
	plugins: [
		commonjs(),
		resolve({
			browser: true,
		}),
		visualizer(),
	],
	external: [
		`combine-arrays`,
		`eventemitter3`,
		`hash-brown-router`,
		`iso-next-tick`,
		`page-path-builder`,
		`path-to-regexp-with-reversible-keys`,
		`then-denodeify`,
	],
}
