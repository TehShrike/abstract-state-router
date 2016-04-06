var test = require('tape-catch')
var fs = require('fs')
var path = require('path')
var cp = require('child_process')

var WEBPACK_BIN = path.resolve(__dirname, '../node_modules/webpack/bin/webpack.js')
var OUTPUT_FILE = '../webpack_build.js'
var ABS_OUTPUT_FILE = path.resolve(__dirname, OUTPUT_FILE)

test('compiles with webpack', function (t) {
	var args = [ WEBPACK_BIN, '../index.js', OUTPUT_FILE ]
	var opts = { cwd: __dirname }
	cp.execFile('node', args, opts, function (err, stdout, stderr) {
		t.ifError(err)
		t.notOk(/error/i.test(stdout), 'stdout does not contain "error"')
		t.notOk(stderr.length, 'stderr is empty')
		
		fs.unlink(ABS_OUTPUT_FILE, function (err) {
			t.ifError(err)
			t.end()
		})
	})
})
