import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import visualizer from 'rollup-plugin-visualizer'

export default {
	input: './index.js',
	output: [
		{
			file: './bundle.js',
			format: 'cjs',
			sourcemap: true,
			exports: 'default'
		},
	],
	plugins: [
		commonjs(),
		resolve({
			browser: true,
		}),
		babel({
			babelHelpers: 'bundled',
		}),
		visualizer(),
	],
	external: [
		'combine-arrays',
		'eventemitter3',
		'hash-brown-router',
		'iso-next-tick',
		'page-path-builder',
		'path-to-regexp-with-reversible-keys',
		'then-denodeify',
	],
}
