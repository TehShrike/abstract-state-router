To manage webapp states so that you don't have to deal with url paths or anything.

[ui-router](https://github.com/angular-ui/ui-router/wiki) is fantastic, and I would use it in all of my projects if it wasn't tied to AngularJS.  Thus, this library!  Written to work with [browserify](https://github.com/substack/node-browserify).

# Construction

	var createStateRouter = require('abstract-state-router')

	var stateRouter = createStateRouter(renderer, rootElement, router)

The renderer should be an object with four properties: render, destroy, getChildElement, and reset.  Still needs to be documented, see test/support/renderer-mock.js for an implementation.

The rootElement is the element where the first-generation states will be created.

router defaults to an instance of a [hash brown router](https://github.com/TehShrike/hash-brown-router/).  It's an optional argument for the purpose of passing in a mock for unit tests.

# stateRouter.addState({name, route, defaultChild, data, template, resolve, activate, querystringParameters})

The addState function takes a single object of options.

`name` is parsed in the same way as ui-router's [dot notation](https://github.com/angular-ui/ui-router/wiki/Nested-States-%26-Nested-Views#dot-notation), so 'contacts.list' is a child state of 'contacts'.

`route` is an express-style url string that is parsed with a fork of [path-to-regexp](https://github.com/pillarjs/path-to-regexp).  If the state is a child state, this route string will be concatenated to the route string of its parent (e.g. if 'contacts' state has route ':user/contacts' and 'contacts.list' has a route of '/list', you could visit the child state by browsing to '/tehshrike/contacts/list').

`defaultChild` is a string (or a function that returns a string) of the default child's name. If you attempt to go directly to a state that has a default child, you will be directed to the default child. (E.g. if 'contacts' has the defaultChild 'list', then doing `state.go('contacts')` will actually do `state.go('contacts.list')`.)

`data` is an object that can hold whatever you want - it will be passed in to the resolve and callback functions.

`template` is a template string/object/whatever to be interpreted by the render function.

`resolve` is a function called when the selected state begins to be transitioned to, allowing you to accomplish the same objective as you would with ui-router's [resolve](https://github.com/angular-ui/ui-router/wiki#resolve).

`activate` is a function called when the state is made active - the equivalent of the AngularJS controller to the ui-router.

`querystringParameters` is an array of query string parameters that will be watched by this state.

## resolve(data, parameters, callback(err, content), redirectCallback(stateName, params))

The first argument is the data object you passed to the addState call.  The second argument is an object containing the parameters that were parsed out of the route params and the query string.

If you call `callback(err, content)` with a truthy err value, the state change will be cancelled and the previous state will remain active.

If you call `redirectCallback(stateName, params)`, the state router will begin transitioning to that state instead.  The current destination will never become active, and will not show up in the browser history.

## activate(context)

The activate function is called when the state becomes active.  It is passed an event emitter named `context` with four properties:

- `domApi`: the DOM API returned by the renderer
- `data`: the data object given to the addState call
- `parameters`: the route/querystring parameters
- `content`: the object passed into the resolveFunction's callback

###events

- 'destroy': emitted when the state is destroyed

# stateRouter.go(stateName, [parameters, [options]])

Browses to the given state, with the current parameters.  Changes the url to match.

The options object currently supports just one option "replace" - if it is truthy, the current state is replaced in the url history.

# State change flow

- emit StateChangeStart
- call all resolve functions
- resolve functions return
- **NO LONGER AT PREVIOUS STATE**
- destroy the contexts of all "destroy" and "change" states
- destroy appropriate dom elements
- reset "change"ing dom elements - still needs implemented
- call render functions for "create"ed states
- call all activate functions
- emit StateChangeEnd

# Every state change does this to states

- destroy: states that are no longer active at all.  The contexts are destroyed, and the DOM elements are destroyed.
- change: states that remain around, but with different parameter values - the DOM sticks around, but the contexts are destroyed and resolve/activate are called again.
- create: states that weren't active at all before.  The DOM elements are rendered, and resolve/activate are called.

# TODO

- states that are "change"ing should have reset called in the renderer, and destroy/activate called on the context, but they should NOT be destroyed in the DOM.
- any state changes that are triggered during a state transition should be queued up and applied once the current state change is done
- optional default parameter values for each state
- "default" child states that are automatically redirected to if no child state is specified
- the ability to set an "error" state to go to on errors
- "redirect somewhere else instead" function in the resolve
- test having multiple states call replace
- abstract states that can not be activated without a child state being active (default child states count)

License
======

[WTFPL](http://wtfpl2.com)

[![Build Status](https://travis-ci.org/TehShrike/abstract-state-router.svg?branch=master)](https://travis-ci.org/TehShrike/abstract-state-router)
