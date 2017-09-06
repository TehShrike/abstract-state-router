abstract-state-router lets you build single-page webapps using nested routes/states.  Your code doesn't reference routes directly, like `/app/users/josh`, but by name and properties, like `app.user` + `{ name: 'josh' }`.

To find out why you should be using this kind of router, read [Why Your Webapp Needs a State-Based Router](http://joshduff.com/#!/post/2015-06-why-you-need-a-state-router.md).

abstract-state-router is heavily inspired by the [original ui-router](https://github.com/angular-ui/ui-router/wiki).  The biggest difference is: you can use abstract-state-router with whatever templating/component library you like.

It is similar in that way to the [new ui-router](https://github.com/ui-router/core), except that abstract-state-router is smaller, its documentation is more readable, and it is easier to create [new renderers for arbitrary view libraries](./renderer.md).

To see an example app implemented with a couple of different browser rendering libraries, [click here to visit the state-router-example on Github Pages](http://tehshrike.github.io/state-router-example).

If you have any questions, [ask me on Gitter](https://gitter.im/TehShrike/abstract-state-router)! [![Join the chat at https://gitter.im/TehShrike/abstract-state-router](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/TehShrike/abstract-state-router)

# Current renderer implementations

- [RactiveJS](https://github.com/TehShrike/ractive-state-router)
- [Riot](https://github.com/TehShrike/riot-state-renderer)
- [virtual-dom](https://github.com/ArtskydJ/virtualdom-state-renderer)
- [Knockout](https://github.com/crissdev/knockout-state-renderer)
- [Svelte](https://github.com/TehShrike/svelte-state-renderer)

If you want to use the state router with any other templating/dom manipulation library, [read these docs](https://github.com/TehShrike/abstract-state-router/blob/master/renderer.md)!  It's not too bad to get started.

# Install

Using npm + your favorite CommonJS bundler is easiest.

```sh

npm install abstract-state-router -S

```

You can also [download the stand-alone build from wzrd.in](https://wzrd.in/standalone/abstract-state-router@latest).  If you include it in a `<script>` tag, a `abstractStateRouter` function will be included on the global scope.

Want to use the abstract-state-router without messing with bundlers or package managers?  Check out the minimum-viable-project code (in a single HTML file!) over at the [simplest-abstract-state-router-usage](https://github.com/TehShrike/simplest-abstract-state-router-usage).

# API

- [`options`](#options)
- [`addState`](#staterouteraddstatename-route-defaultchild-data-template-resolve-activate-querystringparameters-defaultparameters)
	- [`resolve`](#resolvedata-parameters-callbackerr-contentredirectstatename-stateparameters)
	- [`activate`](#activatecontext)
	- [Examples](#addstate-examples)
- [`go`](#stateroutergostatename-stateparameters-options)
- [`evaluateCurrent`](#staterouterevaluatecurrentroutefallbackstatename-fallbackstateparameters)
- [`stateIsActive`](#staterouterstateisactivestatename-stateparameters)
- [`makePath`](#stateroutermakepathstatename-stateparameters-options)
- [Events](#events)
	- [State change](#state-change)
	- [DOM API interactions](#dom-api-interactions)

```js
var createStateRouter = require('abstract-state-router')

var stateRouter = createStateRouter(makeRenderer, rootElement, options)
```

The `makeRenderer` should be a function that returns an object with four properties: render, destroy, getChildElement, and reset.  Documentation is [here](https://github.com/TehShrike/abstract-state-router/blob/master/renderer.md) - see [test/support/renderer-mock.js](https://github.com/TehShrike/abstract-state-router/blob/master/test/helpers/renderer-mock.js) for an example implementation.

The `rootElement` is the element where the first-generation states will be created.

## options

Possible properties of the `options` object are:

- `pathPrefix` defaults to `'#'`.  If you're using HTML5 routing/pushState, you'll most likely want to set this to an empty string.
- `router` defaults to an instance of a [hash brown router@3.x](https://github.com/TehShrike/hash-brown-router/).  The abstract-state-router unit tests use the [hash brown router stub](https://github.com/TehShrike/hash-brown-router/#testability).  To use pushState, pass in a hash brown router created with [sausage-router](https://github.com/TehShrike/sausage-router).
- `throwOnError` defaults to true, because you get way better stack traces in Chrome when you throw than if you `console.log(err)` or emit `'error'` events.  The unit tests disable this.

## stateRouter.addState({name, route, defaultChild, data, template, resolve, activate, querystringParameters, defaultParameters})

The addState function takes a single object of options. All of them are optional, unless stated otherwise.

`name` is parsed in the same way as ui-router's [dot notation](https://github.com/angular-ui/ui-router/wiki/Nested-States-%26-Nested-Views#dot-notation), so 'contacts.list' is a child state of 'contacts'. **Required.**

`route` is an express-style url string that is parsed with a fork of [path-to-regexp](https://github.com/pillarjs/path-to-regexp).  If the state is a child state, this route string will be concatenated to the route string of its parent (e.g. if 'contacts' state has route ':user/contacts' and 'contacts.list' has a route of '/list', you could visit the child state by browsing to '/tehshrike/contacts/list').

`defaultChild` is a string (or a function that returns a string) of the default child's name.  Use the short name (`list`), not the fully qualified name with all its parents (`contacts.list`).

If the viewer navigates to a state that has a default child, the router will redirect to the default child. (For example, if 'list' is the default child of 'contacts', `state.go('contacts')` will actually be equivalent to `state.go('contacts.list')`. Likewise, browsing to '/tehshrike/contacts' would take the viewer to '/tehshrike/contacts/list'.)

`data` is an object that can hold whatever you want - it will be passed in to the resolve and activate functions.

`template` is a template string/object/whatever to be interpreted by the render function. **Required.**

`resolve` is a function called when the selected state begins to be transitioned to, allowing you to accomplish the same objective as you would with ui-router's [resolve](https://github.com/angular-ui/ui-router/wiki#resolve).

`activate` is a function called when the state is made active - the equivalent of the AngularJS controller to the ui-router.

`querystringParameters` is an array of query string parameters that will be watched by this state.

`defaultParameters` is an object whose properties should correspond to parameters defined in the `querystringParameters` option or the route parameters.  Whatever values you supply here will be used as the defaults in case the url does not contain any value for that parameter.

For backwards compatibility reasons, `defaultQuerystringParameters` will work as well (though it does not function any differently).

### resolve(data, parameters, callback(err, content).redirect(stateName, [stateParameters]))

The first argument is the data object you passed to the addState call.  The second argument is an object containing the parameters that were parsed out of the route and the query string.

If you call `callback(err, content)` with a truthy err value, the state change will be cancelled and the previous state will remain active.

If you call `callback.redirect(stateName, [stateParameters])`, the state router will begin transitioning to that state instead.  The current destination will never become active, and will not show up in the browser history.

If you want to redirect with promises, return a rejected promise with an object containing a `redirectTo` property with `name` and `params` values for the state to redirect to.

```js
function resolve(data, parameters) {
	return Promise.reject({
		redirectTo: {
			name: 'otherCoolState',
			params: {
				extraCool: true
			}
		}
	})
}
```

### activate(context)

The activate function is called when the state becomes active.  It is passed an event emitter named `context` with four properties:

- `domApi`: the DOM API returned by the renderer
- `data`: the data object given to the addState call
- `parameters`: the route/querystring parameters
- `content`: the object passed into the resolveFunction's callback

The `context` object is also an event emitter that emits a `'destroy'` event when the state is being transitioned away from.  You should listen to this event to clean up any workers that may be ongoing.

### addState examples

```js
stateRouter.addState({
	name: 'app',
	data: {},
	route: '/app',
	template: '',
	defaultChild: 'tab1',
	resolve: function(data, parameters, cb) {
		// Sync or asnyc stuff; just call the callback when you're done
		isLoggedIn(function(err, isLoggedIn) {
			cb(err, isLoggedIn)
		})
	},
	activate: function(context) {
		// Normally, you would set data in your favorite view library
		var isLoggedIn = context.content
		var ele = document.getElementById('status')
		ele.innerText = isLoggedIn ? 'Logged In!' : 'Logged Out!'
	}
})

stateRouter.addState({
	name: 'app.tab1',
	data: {},
	route: '/tab_1',
	template: '',
	resolve: function(data, parameters, cb) {
		getTab1Data(cb)
	},
	activate: function(context) {
		document.getElementById('tab').innerText = context.content

		var intervalId = setInterval(function() {
			document.getElementById('tab').innerText = 'MORE CONTENT!'
		}, 1000)

		context.on('destroy', function() {
			clearInterval(intervalId)
		})
	}
})

stateRouter.addState({
	name: 'app.tab2',
	data: {},
	route: '/tab_2',
	template: '',
	resolve: function(data, parameters, cb) {
		getTab2Data(cb)
	},
	activate: function(context) {
		document.getElementById('tab').innerText = context.content
	}
})
```

## stateRouter.go(stateName, [stateParameters, [options]])

Browses to the given state, with the current parameters.  Changes the url to match.

The options object currently supports two options:
- `replace` - if it is truthy, the current state is replaced in the url history.
- `inherit` - if true, querystring parameters are inherited from the current state.  Defaults to false.

If a state change is triggered during a state transition, and the DOM hasn't been manipulated yet, then the current state change is discarded, and the new one replaces it. Otherwise, it is queued and applied once the current state change is done.

If `stateName` is `null`, the current state is used as the destination.

```js
stateRouter.go('app')
// This actually redirects to app.tab1, because the app state has the default child: 'tab1'
```

## stateRouter.evaluateCurrentRoute(fallbackStateName, [fallbackStateParameters])

You'll want to call this once you've added all your initial states.  It causes the current path to be evaluated, and will activate the current state.  If the current path doesn't match the route of any available states, the browser gets sent to the fallback state provided.

```js
stateRouter.evaluateCurrentRoute('app.tab2')
```

## stateRouter.stateIsActive(stateName, [stateParameters])

Returns true if `stateName` is the current active state, or an ancestor of the current active state...

...And all of the properties of `stateParameters` match the current state parameter values.

```js
// Current state name: app.tab1
// Current parameters: { fancy: 'yes', thing: 'hello' }
stateRouter.stateIsActive('app.tab1', { fancy: 'yes' }) // => true
stateRouter.stateIsActive('app.tab1', { fancy: 'no' }) // => false
stateRouter.stateIsActive('app') // => true
```

## stateRouter.makePath(stateName, [stateParameters], options)

Returns a path to the state, starting with an [optional](#options) octothorpe `#`, suitable for inserting straight into the `href` attribute of a link.

The `options` object supports one property: `inherit` - if true, querystring parameters are inherited from the current state.  Defaults to false.

If `stateName` is `null`, the current state is used.

```js
stateRouter.makePath('app.tab2', { pants: 'no' })
```

## Events

These are all emitted on the state router object.

### State change

- `stateChangeAttempt(functionThatBeginsTheStateChange)` - used by the state transition manager, probably not useful to anyone else at the moment
- `stateChangeStart(state, parameters)` - emitted after the state name and parameters have been validated
- `stateChangeCancelled(err)` - emitted if a redirect is issued in a resolve function
- `stateChangeEnd(state, parameters)` - after all activate functions are called
- `stateChangeError(err)` - emitted if an error occurs while trying to navigate to a new state - including if you try to navigate to a state that doesn't exist
- `stateError(err)` - emitted if an error occurs in an activation function, or somewhere else that doesn't directly interfere with changing states. Should probably be combined with `stateChangeError` at some point since they're not that different?
- `routeNotFound(route, parameters)` - emitted if the user or some errant code changes the location hash to a route that does not have any states associated with it.  If you have a generic "not found" page you want to redirect people to, you can do so like this:

```js
stateRouter.on('routeNotFound', function(route, parameters) {
	stateRouter.go('not-found', {
		route: route,
		parameters: parameters
	})
})
```

### DOM API interactions

- `beforeCreateState({state, content, parameters})`
- `afterCreateState({state, domApi, content, parameters})`
- `beforeResetState({state, domApi, content, parameters})`
- `afterResetState({state, domApi, content, parameters})`
- `beforeDestroyState({state, domApi})`
- `afterDestroyState({state})`

# Testing/development

To run the unit tests:

- clone this repository
- run `npm install`
- run `npm test`

Automated browser testing provided by [Browserstack](https://www.browserstack.com/).

Tested in Chrome, Firefox, Safari, and IE10+ (IE9 doesn't support [replace](https://developer.mozilla.org/en-US/docs/Web/API/Location/replace)).

[![Build Status](https://travis-ci.org/TehShrike/abstract-state-router.svg?branch=master)](https://travis-ci.org/TehShrike/abstract-state-router)


# State change flow

- emit stateChangeStart
- call all resolve functions
- resolve functions return
- **NO LONGER AT PREVIOUS STATE**
- destroy the contexts of all "destroy" and "change" states
- destroy appropriate dom elements
- reset "change"ing dom elements
- call render functions for "create"ed states
- call all activate functions
- emit stateChangeEnd

# Every state change does this to states

- destroy: states that are no longer active at all.  The contexts are destroyed, and the DOM elements are destroyed.
- change: states that remain around, but with different parameter values - the DOM sticks around, but the contexts are destroyed and resolve/activate are called again.
- create: states that weren't active at all before.  The DOM elements are rendered, and resolve/activate are called.

# HTML5/pushState routing

pushState routing is technically supported.  To use it, pass in an options object with a `router` hash-brown-router constructed with a [sausage-router](https://github.com/TehShrike/sausage-router), and then set the `pathPrefix` option to an empty string.

```js
var makeStateRouter = require('abstract-state-router')
var sausage = require('sausage-router')
var makeRouter = require('hash-brown-router')

var stateRouter = makeStateRouter(makeRenderer, rootElement, {
	pathPrefix: '',
	router: makeRouter(sausage())
})
```

However to use it in the real world, there are two things you probably want to do:

## Intercept link clicks

To get all the benefits of navigating around nested states, you'll need to intercept every click on a link and block the link navigation, calling `go(path)` on the sausage-router instead.

You would need to add these click handlers whenever a state change happened.

## server-side rendering

You would also need to be able to render the correct HTML on the server-side.

For this to even possible, your chosen rendering library needs to be able to work on the server-side to generate static HTML.  I know at least Ractive.js and Riot support this.

The abstract-state-router would need to be changed to supply the list of nested DOM API objects for your chosen renderer.

Then to generate the static HTML for the current route, you would create an abstract-state-router, tell it to navigate to that route, collect all the nested DOM API objects, render them as HTML strings, embedding the children inside of the parents.

You would probably also want to send the client the data that was returned by the `resolve` functions, so that when the JavaScript app code started running the abstract-state-router on the client-side, it wouldn't hit the server to fetch all the data that had already been fetched on the server to generate the original HTML.

## Who's adding this?

Track development progress in [#48](https://github.com/TehShrike/abstract-state-router/issues/48).

It could be added by  me, but probably not in the near future, since I will mostly be using this for form-heavy business apps where generating static HTML isn't any benefit.

If I use the abstract-state-router on an app where I want to support clients without JS, then I'll start working through those tasks in the issue above.

If anyone else has need of this functionality and wants to get keep making progress on it, I'd be happy to help.  Stop by the [chat room](https://gitter.im/TehShrike/abstract-state-router) to ask any questions.

# Maintainers

- [TehShrike](https://github.com/TehShrike)
- [ArtskydJ](https://github.com/ArtskydJ)

# License

[WTFPL](http://wtfpl2.com)
