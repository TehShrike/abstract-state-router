var parse5 = require('parse5')
var EventEmitter = require('eventemitter3')
var shortid = require('shortid')

function getView(ast) {
    if(!ast.childNodes) return null
    for (let i = 0; i < ast.childNodes.length; i++) {
        let child = ast.childNodes[i]
        if (child.tagName === 'ui-view' || (child.attrs && child.attrs.some(attr => attr.name === 'ui-view'))) return child
    }
    for (let i = 0; i < ast.childNodes.length; i++) {
        let child = ast.childNodes[i]
        let result = getView(child)
        if (result) return result
    }
    return null
}

var htmlFragment = module.exports = function (element) {
    var parsedElement = null
    var childElement = null
    var result = Object.defineProperties(Object.assign(new EventEmitter, {
        data: null,
        postRender: function () {
            result.emit('postRender', result)
            if (!parsedElement) throw new Error("Nothing to do")
            if (!result.child) {
                return parse5.serialize(parsedElement)
            }
            if (!result.child.postRender) throw new Error("Child should be an htmlFragment object")
            var view = getView(parsedElement)
            if (!view) throw new Error("No ui-view found, either use a ui-view tag or a ui-view attribute")
            view.childNodes.length = 0
            Array.prototype.push.apply(view.childNodes, parse5.parseFragment(result.child.postRender()).childNodes)
            if (result.child.data) {
                var id = shortid.generate()
                view.attrs = view.attrs || []
                view.attrs.push({name: 'data-island', value: id})
                Array.prototype.push.apply(view.childNodes, parse5.parseFragment('<script>var dataIslands = dataIslands || {};dataIslands["' + id + '"] = ' + JSON.stringify(result.child.data) + ';document.querySelector("[data-island=' + id + ']").sourceData = dataIslands["' + id + '"]</script>').childNodes)
            }

            return parse5.serialize(parsedElement)
        },
        createChild: function (element) {
            return result.child = htmlFragment(element)
        }
    }), {
        element: {
            get() {
                return parsedElement
            },
            set(value) {
                if (!value) {
                    parsedElement = null
                    return
                }
                if (typeof value === 'string') {
                    parsedElement = parse5.parseFragment(value)
                } else {
                    parsedElement = value
                }
            }
        },
        child: {
            get() {
                return childElement
            },
            set(value) {
                result.emit('setChild', value)
                childElement = value
            }
        }

    })
    result.element = element
    return result
}
