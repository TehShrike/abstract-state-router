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
