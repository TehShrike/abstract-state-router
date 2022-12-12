const StateState = require(`./lib/state-state`)
const StateComparison = require(`./lib/state-comparison`)
const CurrentState = require(`./lib/current-state`)
const stateChangeLogic = require(`./lib/state-change-logic`)
const parse = require(`./lib/state-string-parser`)
const StateTransitionManager = require(`./lib/state-transition-manager`)
const defaultRouterOptions = require(`./default-router-options.js`)

const series = require(`./lib/promise-map-series`)
const extend = require(`./lib/extend.js`)

const denodeify = require(`then-denodeify`)
const EventEmitter = require(`eventemitter3`)
const newHashBrownRouter = require(`hash-brown-router`)
const combine = require(`combine-arrays`)
const buildPath = require(`page-path-builder`)
const nextTick = require(`iso-next-tick`)

const getProperty = name => obj => obj[name]
const reverse = ary => ary.slice().reverse()
const isFunction = property => obj => typeof obj[property] === `function`
const isThenable = object => object && (typeof object === `object` || typeof object === `function`) && typeof object.then === `function`
const promiseMe = (fn, ...args) => new Promise(resolve => resolve(fn(...args)))

const expectedPropertiesOfAddState = [ `name`, `route`, `defaultChild`, `data`, `template`, `resolve`, `activate`, `querystringParameters`, `defaultQuerystringParameters`, `defaultParameters` ]

module.exports = function StateProvider(makeRenderer, rootElement, stateRouterOptions = {}) {
	const prototypalStateHolder = StateState()
	const lastCompletelyLoadedState = CurrentState()
	const lastStateStartedActivating = CurrentState()
	const stateProviderEmitter = new EventEmitter()
	const compareStartAndEndStates = StateComparison(prototypalStateHolder)

	const stateNameToArrayofStates = stateName => parse(stateName).map(prototypalStateHolder.get)

	StateTransitionManager(stateProviderEmitter)
	const { throwOnError, pathPrefix } = extend({
		throwOnError: true,
		pathPrefix: `#`,
	}, stateRouterOptions)

	const router = stateRouterOptions.router || newHashBrownRouter(defaultRouterOptions)

	router.on(`not found`, (route, parameters) => {
		stateProviderEmitter.emit(`routeNotFound`, route, parameters)
	})

	let destroyDom = null
	let getDomChild = null
	let renderDom = null

	let activeStateResolveContent = {}
	const activeDomApis = {}
	const activeEmitters = {}

	function handleError(event, err) {
		nextTick(() => {
			stateProviderEmitter.emit(event, err)
			console.error(`${ event } - ${ err.message }`)
			if (throwOnError) {
				throw err
			}
		})
	}

	function destroyStateName(stateName) {
		const state = prototypalStateHolder.get(stateName)
		stateProviderEmitter.emit(`beforeDestroyState`, {
			state,
			domApi: activeDomApis[stateName],
		})

		activeEmitters[stateName].emit(`destroy`)
		activeEmitters[stateName].removeAllListeners()
		delete activeEmitters[stateName]
		delete activeStateResolveContent[stateName]

		return destroyDom(activeDomApis[stateName]).then(() => {
			delete activeDomApis[stateName]
			stateProviderEmitter.emit(`afterDestroyState`, {
				state,
			})
		})
	}

	function getChildElementForStateName(stateName) {
		return new Promise(resolve => {
			const parent = prototypalStateHolder.getParent(stateName)
			if (parent) {
				resolve(getDomChild(activeDomApis[parent.name]).then(childDomApi => {
					if (!childDomApi) {
						return Promise.reject(new Error(`getDomChild returned a falsey element, did you forget to add a place for a child state to go?`))
					}
					return childDomApi
				}))
			} else {
				resolve(rootElement)
			}
		})
	}

	function renderStateName(parameters, stateName) {
		return getChildElementForStateName(stateName).then(element => {
			const state = prototypalStateHolder.get(stateName)
			const content = getContentObject(activeStateResolveContent, stateName)

			stateProviderEmitter.emit(`beforeCreateState`, {
				state,
				content,
				parameters,
			})

			return renderDom({
				template: state.template,
				element,
				content,
				parameters,
			}).then(domApi => {
				activeDomApis[stateName] = domApi
				stateProviderEmitter.emit(`afterCreateState`, {
					state,
					domApi,
					content,
					parameters,
				})
				return domApi
			})
		})
	}

	function renderAll(stateNames, parameters) {
		return series(stateNames, stateName => renderStateName(parameters, stateName))
	}

	function onRouteChange(state, parameters) {
		try {
			const finalDestinationStateName = prototypalStateHolder.applyDefaultChildStates(state.name)

			if (finalDestinationStateName === state.name) {
				emitEventAndAttemptStateChange(finalDestinationStateName, parameters)
			} else {
				// There are default child states that need to be applied

				const theRouteWeNeedToEndUpAt = makePath(finalDestinationStateName, parameters)
				const currentRoute = router.location.get()

				if (theRouteWeNeedToEndUpAt === currentRoute) {
					// the child state has the same route as the current one, just start navigating there
					emitEventAndAttemptStateChange(finalDestinationStateName, parameters)
				} else {
					// change the url to match the full default child state route
					stateProviderEmitter.go(finalDestinationStateName, parameters, { replace: true })
				}
			}
		} catch (err) {
			handleError(`stateError`, err)
		}
	}

	function addState(state) {
		if (typeof state === `undefined`) {
			throw new Error(`Expected 'state' to be passed in.`)
		} else if (typeof state.name === `undefined`) {
			throw new Error(`Expected the 'name' option to be passed in.`)
		} else if (typeof state.template === `undefined`) {
			throw new Error(`Expected the 'template' option to be passed in.`)
		}
		Object.keys(state).filter(key => expectedPropertiesOfAddState.indexOf(key) === -1).forEach(key => {
			console.warn(`Unexpected property passed to addState:`, key)
		})

		prototypalStateHolder.add(state.name, state)

		const route = prototypalStateHolder.buildFullStateRoute(state.name)

		router.add(route, parameters => onRouteChange(state, parameters))
	}

	function computeDefaultParams(defaultParams) {
		const computedDefaultParams = {}

		Object.keys(defaultParams).forEach(key => {
			computedDefaultParams[key] = typeof defaultParams[key] === `function` ? defaultParams[key]() : defaultParams[key]
		})

		return computedDefaultParams
	}

	function getStatesToResolve(stateChanges) {
		return stateChanges.create.map(prototypalStateHolder.get)
	}

	function emitEventAndAttemptStateChange(newStateName, parameters) {
		stateProviderEmitter.emit(`stateChangeAttempt`, function stateGo(transition) {
			attemptStateChange(newStateName, parameters, transition)
		})
	}

	function attemptStateChange(newStateName, parameters, transition) {
		function ifNotCancelled(fn) {
			return (...args) => {
				if (transition.cancelled) {
					const err = new Error(`The transition to ${ newStateName } was cancelled`)
					err.wasCancelledBySomeoneElse = true
					throw err
				} else {
					return fn(...args)
				}
			}
		}

		return promiseMe(prototypalStateHolder.guaranteeAllStatesExist, newStateName)
			.then(function applyDefaultParameters() {
				const state = prototypalStateHolder.get(newStateName)
				const defaultParams = state.defaultParameters || state.defaultQuerystringParameters || {}
				const needToApplyDefaults = Object.keys(defaultParams).some(function missingParameterValue(param) {
					return typeof parameters[param] === `undefined`
				})

				if (needToApplyDefaults) {
					throw redirector(newStateName, extend(computeDefaultParams(defaultParams), parameters))
				}
				return state
			}).then(ifNotCancelled(state => {
				stateProviderEmitter.emit(`stateChangeStart`, state, parameters, stateNameToArrayofStates(state.name))
				lastStateStartedActivating.set(state.name, parameters)
			})).then(function getStateChanges() {
				const stateComparisonResults = compareStartAndEndStates({
					original: lastCompletelyLoadedState.get(),
					destination: {
						name: newStateName,
						parameters,
					},
				})
				return stateChangeLogic(stateComparisonResults) // { destroy, change, create }
			}).then(ifNotCancelled(function resolveDestroyAndActivateStates(stateChanges) {
				return resolveStates(getStatesToResolve(stateChanges), extend(parameters)).catch(function onResolveError(e) {
					e.stateChangeError = true
					throw e
				}).then(ifNotCancelled(function destroyAndActivate(stateResolveResultsObject) {
					transition.cancellable = false

					const activateAll = () => activateStates(
						stateChanges.create,
					)

					return series(reverse(stateChanges.destroy), destroyStateName).then(
						() => {
							activeStateResolveContent = extend(activeStateResolveContent, stateResolveResultsObject)
							return renderAll(stateChanges.create, extend(parameters)).then(activateAll)
						},
					)
				}))

				function activateStates(stateNames) {
					return stateNames.map(prototypalStateHolder.get).forEach(state => {
						const emitter = new EventEmitter()
						const context = Object.create(emitter)
						context.domApi = activeDomApis[state.name]
						context.data = state.data
						context.parameters = parameters
						context.content = getContentObject(activeStateResolveContent, state.name)
						activeEmitters[state.name] = emitter

						try {
							state.activate && state.activate(context)
						} catch (e) {
							nextTick(() => {
								throw e
							})
						}
					})
				}
			})).then(function stateChangeComplete() {
				lastCompletelyLoadedState.set(newStateName, parameters)
				try {
					stateProviderEmitter.emit(`stateChangeEnd`, prototypalStateHolder.get(newStateName), parameters, stateNameToArrayofStates(newStateName))
				} catch (e) {
					handleError(`stateError`, e)
				}
			}).catch(ifNotCancelled(function handleStateChangeError(err) {
				if (err && err.redirectTo) {
					stateProviderEmitter.emit(`stateChangeCancelled`, err)
					return stateProviderEmitter.go(err.redirectTo.name, err.redirectTo.params, { replace: true })
				} else if (err) {
					handleError(`stateChangeError`, err)
				}
			})).catch(function handleCancellation(err) {
				if (err && err.wasCancelledBySomeoneElse) {
					// we don't care, the state transition manager has already emitted the stateChangeCancelled for us
				} else {
					throw new Error(`This probably shouldn't happen, maybe file an issue or something ${ err }`)
				}
			})
	}

	function makePath(stateName, parameters, options) {
		function getGuaranteedPreviousState() {
			if (!lastStateStartedActivating.get().name) {
				throw new Error(`makePath required a previous state to exist, and none was found`)
			}
			return lastStateStartedActivating.get()
		}
		if (options && options.inherit) {
			parameters = extend(getGuaranteedPreviousState().parameters, parameters)
		}

		const destinationStateName = stateName === null ? getGuaranteedPreviousState().name : stateName

		const destinationState = prototypalStateHolder.get(destinationStateName) || {}
		const defaultParams = destinationState.defaultParameters || destinationState.defaultQuerystringParameters || {}

		parameters = extend(computeDefaultParams(defaultParams), parameters)

		prototypalStateHolder.guaranteeAllStatesExist(destinationStateName)
		const route = prototypalStateHolder.buildFullStateRoute(destinationStateName)
		return buildPath(route, parameters || {})
	}

	const defaultOptions = {
		replace: false,
	}

	stateProviderEmitter.addState = addState
	stateProviderEmitter.go = (newStateName, parameters, options) => {
		options = extend(defaultOptions, options)
		const goFunction = options.replace ? router.replace : router.go

		return promiseMe(makePath, newStateName, parameters, options)
			.then(goFunction, err => handleError(`stateChangeError`, err))
	}
	stateProviderEmitter.evaluateCurrentRoute = (defaultState, defaultParams) => promiseMe(makePath, defaultState, defaultParams).then(defaultPath => {
		router.evaluateCurrent(defaultPath)
	}).catch(err => handleError(`stateError`, err))
	stateProviderEmitter.makePath = (stateName, parameters, options) => pathPrefix + makePath(stateName, parameters, options)
	stateProviderEmitter.getActiveState = () => lastCompletelyLoadedState.get()
	stateProviderEmitter.stateIsActive = (stateName = null, parameters = null) => {
		const currentState = lastCompletelyLoadedState.get()
		const stateNameMatches = currentState.name === stateName
			|| currentState.name.indexOf(stateName + `.`) === 0
			|| stateName === null
		const parametersWereNotPassedIn = !parameters

		return stateNameMatches
			&& (parametersWereNotPassedIn || Object.keys(parameters).every(key => parameters[key] + `` === currentState.parameters[key]))
	}

	const renderer = makeRenderer(stateProviderEmitter)

	destroyDom = denodeify(renderer.destroy)
	getDomChild = denodeify(renderer.getChildElement)
	renderDom = denodeify(renderer.render)

	return stateProviderEmitter
}

function getContentObject(stateResolveResultsObject, stateName) {
	const allPossibleResolvedStateNames = parse(stateName)

	return allPossibleResolvedStateNames
		.filter(stateName => stateResolveResultsObject[stateName])
		.reduce((obj, stateName) => extend(obj, stateResolveResultsObject[stateName]), {})
}

function redirector(newStateName, parameters) {
	return {
		redirectTo: {
			name: newStateName,
			params: parameters,
		},
	}
}

// { [stateName]: resolveResult }
function resolveStates(states, parameters) {
	const statesWithResolveFunctions = states.filter(isFunction(`resolve`))
	const stateNamesWithResolveFunctions = statesWithResolveFunctions.map(getProperty(`name`))

	const resolves = Promise.all(statesWithResolveFunctions.map(state => new Promise((resolve, reject) => {
		const resolveCb = (err, content) => err ? reject(err) : resolve(content)

		resolveCb.redirect = (newStateName, parameters) => {
			reject(redirector(newStateName, parameters))
		}

		const res = state.resolve(state.data, parameters, resolveCb)
		if (isThenable(res)) {
			resolve(res)
		}
	})))

	return resolves.then(resolveResults =>
		combine({
			stateName: stateNamesWithResolveFunctions,
			resolveResult: resolveResults,
		}).reduce((obj, result) => {
			obj[result.stateName] = result.resolveResult
			return obj
		}, {}),
	)
}
