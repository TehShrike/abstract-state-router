var pathtoRegexp = require('path-to-regexp')

var output = pathtoRegexp('/users/:user')
console.log(output.keys)
