# [7.5.2](https://github.com/TehShrike/abstract-state-router/releases/tag/v7.5.2)

Fix: only call `canLeaveState` on states that are going to be destroyed, not the ones that are going to get created.

# [7.5.1](https://github.com/TehShrike/abstract-state-router/releases/tag/v7.5.1)

Fix a bug that could cause `canLeaveState` to be called twice.  [#155](https://github.com/TehShrike/abstract-state-router/pull/155)

# [7.5.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v7.5.0)

Add `canLeaveState` to `addState`, so you can implement route guards to prevent people from navigating away from a state if they e.g. have unsaved state.  [#154](https://github.com/TehShrike/abstract-state-router/pull/154)

# [7.4.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v7.4.0)

Support passing in a `null` state name to `stateIsActive`.

# [7.3.1](https://github.com/TehShrike/abstract-state-router/releases/tag/v7.3.1)

Fixes an issue where when a state was destroyed and resolved during the same state change, the result of its `resolve` function would get tossed out.

# [7.3.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v7.3.0)

Removes the concept of resetting states.

The concept of resetting breaks down if your component library doesn't support
- slots
- resetting the state of a component without resetting the contents of slots

For renderers that "reset" states by destroying the existing component and re-constructing it, stuff would break in any case where a parent and child state were both told to reset at once.  Whenever the parent would reset and destroy its part of the DOM, the child would get wiped out.

Existing renderers don't need to change to work with this version of ASR, it's just that their `reset` function won't get called any more.

The `beforeResetState` and `afterResetState` should not be fired any more.

# [7.2.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v7.2.0)

- Coerce parameter values to strings for comparison in `stateIsActive` [#151](https://github.com/TehShrike/abstract-state-router/pull/151)

# [7.1.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v7.1.0)

- Give an explicit/useful error message if you forget to add a `ui-view` element to a parent template [#148](https://github.com/TehShrike/abstract-state-router/pull/148)

# [7.0.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v7.0.0)

- maintenance: update a bunch of dependencies [#141](https://github.com/TehShrike/abstract-state-router/pull/141)
- maintenance: autoformat the scripts to make myself feel better and reduce commit noise in the future [#145](https://github.com/TehShrike/abstract-state-router/pull/145)
- breaking: dropped ES5 support.  If you're targeting ES5 you'll need to compile it in your own app's build.

# [6.2.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v6.2.0)

- feature: allow dynamic parameter defaults via functions [#144](https://github.com/TehShrike/abstract-state-router/pull/144)

# [6.1.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v6.1.0)

- feature: added `getActiveState` method [#121](https://github.com/TehShrike/abstract-state-router/pull/121)

# [6.0.5](https://github.com/TehShrike/abstract-state-router/releases/tag/v6.0.5)

- maintenance: added a bunch of files to the `.npmignore` to reduce the package download size

# [6.0.4](https://github.com/TehShrike/abstract-state-router/releases/tag/v6.0.4)

- bug fix: update the hash-brown-router dependency to fix an issue where calling `evaluateCurrent('somestate')` wouldn't do anything when `somestate`'s route was `/` and the current url was also `/`.  Issue #116 in abstract-state-router, commit [#56c207f0](https://github.com/TehShrike/hash-brown-router/commit/56c207f011600722f2a805f88ab2381eb55fde2f) in hash-brown-router.  If you're passing in your own hash-brown-router instance, make sure to update it to 3.3.1 to avoid the bug.

# [6.0.3](https://github.com/TehShrike/abstract-state-router/releases/tag/v6.0.3)

- bug fix: point package.main at the ES5 bundle instead of the ES2015 code :-x [34ea0baa](https://github.com/TehShrike/abstract-state-router/commit/34ea0baa3286affed51d1a493aeedbb5b40819ae)

# [6.0.2](https://github.com/TehShrike/abstract-state-router/releases/tag/v6.0.2)

- bug fix: fixed a crash that would happen if you didn't pass an options object in [3b60669b](https://github.com/TehShrike/abstract-state-router/commit/3b60669b03807ebded9ac4fecfbca0f46070c63d)

# [6.0.1](https://github.com/TehShrike/abstract-state-router/releases/tag/v6.0.1)

- dependency update: changed hash-brown-router dependency from ~3.2.0 to ^3.3.0 [a593408b](https://github.com/TehShrike/abstract-state-router/commit/a593408be27daf7f2f33207b6ec38ab5b04b1406)

# [6.0.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v6.0.0)

- `Promise` and `Object.assign` polyfills are now required for older browsers
- refactor: updated all the source code to ES2015 (though the published version is still compiled down to ES5)

# [5.17.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.17.0)

- functional: `stateChangeStart` and `stateChangeEnd` events now also emit the full array of states being transitioned to. [#113](https://github.com/TehShrike/abstract-state-router/pull/113)

# [5.16.3](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.16.3)

- documentation: added a table of contents to the API section of the readme [#111](https://github.com/TehShrike/abstract-state-router/pull/111)

# [5.16.2](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.16.2)

- drop dependencies on the `process` and `events` polyfills and bump hash-brown-router dependency, saving about 25KB

# [5.16.1](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.16.1)

- documentation: fixed a requre/require typo [#103](https://github.com/TehShrike/abstract-state-router/pull/103)
- documentation: added "inherit" to the documented `go()` options [#104](https://github.com/TehShrike/abstract-state-router/pull/104)
- documentation: in the rendered docs, fixed the link to the ractive example source code [8511b651](https://github.com/TehShrike/abstract-state-router/commit/8511b651de025af466e70cc9fb0bfa5c3ad351f6)

# [5.16.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.16.0)

- updated hash-brown-router to 3.1.0, making the `/` route equivalent to an empty route string [#102](https://github.com/TehShrike/abstract-state-router/pull/102)

# [5.15.1](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.15.1)

- updated hash-brown-router [#93](https://github.com/TehShrike/abstract-state-router/pull/93)
- compatibility: switched from `require('events').EventEmitter` to `require('events')` for better Rollup compatibility. [c861f5ab](https://github.com/TehShrike/abstract-state-router/commit/c861f5ab2d0c5d34915c6344fc8ef2d5a7982db2)

# [5.15.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.15.0)

- functional: renderers may now return a new DOM API from the reset function. [c07a45fb](https://github.com/TehShrike/abstract-state-router/commit/c07a45fba4d50d95c78822e2227529ca4aea29f8)

# [5.14.1](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.14.1)

- bug fix: empty strings in default parameters would cause the state router to stop cold without any error message [#2abf9361](https://github.com/TehShrike/abstract-state-router/commit/2abf936172271369c07413f47c9917dd9d36c005)

# [5.14.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.14.0)

- functional: replaced the `defaultQuerystringParameters` property on states with `defaultParameters`, which applies to both querystring and route parameters.  If you don't specify `defaultParameters`, `defaultQuerystringParameters` will be checked too (though it will now apply to route parameters as well).  [#91](https://github.com/TehShrike/abstract-state-router/issues/91)

# [5.13.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.13.0)

- functional: made `stateName` optional for `go`/`replace`/`makePath` [#83](https://github.com/TehShrike/abstract-state-router/pull/83)

# [5.12.5](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.12.5)

- dependency update: require page-path-builder 1.0.3, fixing a path-building bug [#650af6af](https://github.com/TehShrike/abstract-state-router/commit/650af6af9ad622caecd1c8ea7b02dfb22aa63ff2)

# [5.12.4](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.12.4)

- bug fix: `stateIsActive` was doing an extremely naive check [#71](https://github.com/TehShrike/abstract-state-router/pull/71)

# [5.12.3](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.12.3)

- bug fix: `makePath(stateName, params, { inherit: true })` now properly inherits route parameters during the render/activate phases [#7617d74b](https://github.com/TehShrike/abstract-state-router/commit/7617d74be416d57ac2726cd0d45744627963ec2e)

# [5.12.2](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.12.2)

- bug fix: fixed Webpack build by changing a JSON file to CommonJS [#65](https://github.com/TehShrike/abstract-state-router/issues/65)

# [5.12.1](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.12.1)

- bug fix: states that had child states without routes weren't necessarily loading the correct child state when you browsed to them [#85112c79](https://github.com/TehShrike/abstract-state-router/commit/85112c7965c1bcdea1576b9d8c4f7585b65380e4)

# [5.12.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.12.0)

- documentation: documented the `stateChangeError` event
- documentation: documented the `stateError` event
- functional: added the `routeNotFound` event when a route is visited that doesn't have any states associated with it https://github.com/TehShrike/abstract-state-router/commit/f3e2fbda5fa85068df3aa9f9539d61bb95667caf

# [5.11.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.11.0)

- functional: added a `parameters` property to the context objects emitted with the `beforeCreateState`, `afterCreateState`, `beforeResetState`, and `afterResetState` events. https://github.com/TehShrike/abstract-state-router/commit/c81228b49d0808fe722cda718598816e3c8ac5b3

# [5.10.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.10.0)

- functional: changed `destroy` to be emitted to the active states after `beforeDestroyState`/`beforeResetState` is emitted on the state router https://github.com/TehShrike/abstract-state-router/commit/8522a300ad23ed45dce0c6be1398bfb3883dd98c
- documentation: added the event list https://github.com/TehShrike/abstract-state-router/pull/58
- functional: added an "inherit" option when navigating to a new state https://github.com/TehShrike/abstract-state-router/pull/57
- added an "inherit" option to makePath

# [5.9.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.9.0)

- functional: added emitting events before and after calling every dom rendering function https://github.com/TehShrike/abstract-state-router/pull/54

# [5.8.1](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.8.1)

- functional: added console warnings if you call `stateRouter.addState` passing in an object with unexpected properties https://github.com/TehShrike/abstract-state-router/commit/67618b75e7a4e310cb8c3e15f31e3157e2921f6f
- tests/documentation: fixed some discrepencies highlighted by the above warnings https://github.com/TehShrike/abstract-state-router/commit/438e0a14ad16181f16881f771d543ccdada8d690
- documentation: changed `params`/`stateParameters` naming to be consistent by changing everything to `stateParameters`

# [5.8.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.8.0)

- functional: changed parameters objects passed to the DOM rendering functions to be mutable copies instead of being frozen
