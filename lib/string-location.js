var EventEmitter = require('eventemitter3')
module.exports = function location() {
    var emitter = new EventEmitter()
    emitter._currentRoute = ''
    function go(route) {
        emitter.currentRoute = route
    }
    emitter.go = go
    emitter.replace = go
    emitter.get = () => {
        return emitter._currentRoute
    }
    Object.defineProperties(emitter, {
        currentRoute: {
            get: function () {
                return emitter._currentRoute
            },
            set: function (value) {
                emitter._currentRoute = value
                emitter.emit('hashchange')
            }
        }
    })
    return emitter
}
