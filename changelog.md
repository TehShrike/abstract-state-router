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

- feature: renderers may now return a new DOM API from the reset function. [c07a45fb](https://github.com/TehShrike/abstract-state-router/commit/c07a45fba4d50d95c78822e2227529ca4aea29f8)

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
