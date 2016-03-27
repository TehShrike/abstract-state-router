# [5.11.0](https://github.com/TehShrike/abstract-state-router/releases/tag/v5.11.0)

- functional: added a `parameters` property to the context objects emitted with the `beforeCreateState`, `afterCreateState`, `beforeResetState`, and `afterResetState` events.

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
