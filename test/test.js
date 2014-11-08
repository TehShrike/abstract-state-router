/* Don't forget to test
- calling go with replace=true, and then having that state also call replace, or just error out the state transition

*/

var test = require('tape')
var pathtoRegexp = require('path-to-regexp')
var stateToUrl = require('../state-to-url.js')

