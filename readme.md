To manage webapp states so that you don't have to deal with url paths or anything.

[ui-router](https://github.com/angular-ui/ui-router/wiki) is fantastic, and I would use it in all of my projects if it wasn't tied to AngularJS.  Thus, this library!  Written to work with [browserify](https://github.com/substack/node-browserify).

# Construction

	var createStateRouter = require('abstract-state-router')

	var stateRouter = createStateRouter(renderer, rootElement, router)

The renderer should be an object with four properties: render, destroy, getChildElement, and reset.  Still needs to be documented, see test/support/renderer-mock.js for an implementation.

The rootElement is the element where the first-generation states will be created.

router defaults to an instance of a [hash brown router](https://github.com/TehShrike/hash-brown-router/).  It's an optional argument for the purpose of passing in a mock for unit tests.

# stateRouter.addState({name, route, data, template, resolve, activate, destroy})

The addState function takes a single object of options.

`name` is parsed in the same way as ui-router's [dot notation](https://github.com/angular-ui/ui-router/wiki/Nested-States-%26-Nested-Views#dot-notation), so 'contacts.list' is a child state of 'contacts'.

`route` is an express-style url string that is parsed with a fork of [path-to-regexp](https://github.com/pillarjs/path-to-regexp).  If the state is a child state, this route string will be concatenated to the route string of its parent (e.g. if 'contacts' state has route ':user/contacts' and 'contacts.list' has a route of '/list', you could visit the child state by browsing to '/tehshrike/contacts/list').

`data` is an object that can hold whatever you want - it will be passed in to the resolve and callback functions.

`template` is a template string/object/whatever to be interpreted by the render function

`resolve` is a function called when the selected state begins to be transitioned to, allowing you to accomplish the same objective as you would with ui-router's [resolve](https://github.com/angular-ui/ui-router/wiki#resolve).

`activate` is a function called when the state is made active - the equivalent of the AngularJS controller to the ui-router.

`destroy` is an event emitter that emits a 'destroy' event when the state is destroyed.

## resolve(data, parameters, callback(err, content), redirectCallback(stateName, params))

The first argument is the data object you passed to the addState call.  The second argument is an object containing the parameters that were parsed out of the route params and the query string.

If you call `callback(err, content)` with a truthy err value, the state change will be cancelled and the previous state will remain active.

If you call `redirectCallback(stateName, params)`, the state router will begin transitioning to that state instead.  The current destination will never become active, and will not show up in the browser history.

## activate(context)

The activate function is called when the state becomes active.  It is passed a context object with four properties:

- `domApi`: the DOM API returned by the renderer
- `data`: the data object given to the addState call
- `parameters`: the route/querystring parameters
- `content`: the object passed into the resolveFunction's callback.

This is the point where you display the view for the current state!

# stateRouter.go(stateName, parameters, [options])

Browses to the given state, with the current parameters.  Changes the url to match.

The options object currently supports just one option "replace" - if it is truthy, the current state is replaced in the url history.

# State change flow

- emit StateChangeStarted
- call all resolve functions
- resolve functions return
= NO LONGER AT PREVIOUS STATE
- destroy existing dom elements
- call all render functions
- call all controller functions

# TODO

- optional default parameter values for each state
- "default" child states that are automatically redirected to if no child state is specified
- the ability to set an "error" state to go to on errors
- "redirect somewhere else instead" function in the resolve
- test having multiple states call replace

License
======

[WTFPL](http://wtfpl2.com)

