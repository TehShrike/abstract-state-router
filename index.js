import StateState from './lib/state-state.js'
import StateComparison from './lib/state-comparison.js'
import CurrentState from './lib/current-state.js'
import stateChangeLogic from './lib/state-change-logic.js'
import parse from './lib/state-string-parser.js'
import StateTransitionManager from './lib/state-transition-manager.js'
import defaultRouterOptions from './default-router-options.js'

import series from './lib/promise-map-series.js'

import denodeify from 'then-denodeify'
import EventEmitter from 'eventemitter3'
import newHashBrownRouter from 'hash-brown-router'
import combine from 'combine-arrays'
import buildPath from 'page-path-builder'
import nextTick from 'iso-next-tick'

const getProperty = name => obj => obj[name]
const reverse = ary => ary.slice().reverse()
const isFunction = property => obj => typeof obj[property] === `function`

const expectedPropertiesOfAddState = [ `name`, `route`, `defaultChild`, `data`, `template`, `resolve`, `activate`, `querystringParameters`, `defaultQuerystringParameters`, `defaultParameters`, `canLeaveState` ]

export default function StateProvider(makeRenderer, rootElement, stateRouterOptions = {}) {
	const prototypalStateHolder = StateState()
	const lastCompletelyLoadedState = CurrentState()
	const lastStateStartedActivating = CurrentState()
	const stateProviderEmitter = new EventEmitter()
	const compareStartAndEndStates = StateComparison(prototypalStateHolder)

	const stateNameToArrayofStates = stateName => parse(stateName).map(prototypalStateHolder.get)

	StateTransitionManager(stateProviderEmitter)
	const { throwOnError, pathPrefix } = {
		throwOnError: true,
		pathPrefix: `#`,
		...stateRouterOptions,
	}

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

	async function destroyStateName(stateName) {
		const state = prototypalStateHolder.get(stateName)
		stateProviderEmitter.emit(`beforeDestroyState`, {
			state,
			domApi: activeDomApis[stateName],
		})

		activeEmitters[stateName].emit(`destroy`)
		activeEmitters[stateName].removeAllListeners()
		delete activeEmitters[stateName]
		delete activeStateResolveContent[stateName]

		await destroyDom(activeDomApis[stateName], { name: stateName })
		delete activeDomApis[stateName]
		stateProviderEmitter.emit(`afterDestroyState`, {
			state,
		})
	}

	async function getChildElementForStateName(stateName) {
		const parent = prototypalStateHolder.getParent(stateName)
		if (parent) {
			const childDomApi = await getDomChild(activeDomApis[parent.name], { name: stateName })
			if (!childDomApi) {
				throw new Error(`getDomChild returned a falsey element, did you forget to add a place for a child state to go?`)
			}
			return childDomApi
		} else {
			return rootElement
		}
	}

	async function renderStateName(parameters, stateName) {
		const element = await getChildElementForStateName(stateName)

		const state = prototypalStateHolder.get(stateName)
		const content = getContentObject(activeStateResolveContent, stateName)

		stateProviderEmitter.emit(`beforeCreateState`, {
			state,
			content,
			parameters,
		})

		const domApi = await renderDom({
			template: state.template,
			element,
			content,
			parameters,
			name: stateName,
		})

		activeDomApis[stateName] = domApi
		stateProviderEmitter.emit(`afterCreateState`, {
			state,
			domApi,
			content,
			parameters,
		})
		return domApi
	}

	function renderAll(stateNames, parameters) {
		return series(stateNames, stateName => renderStateName(parameters, stateName))
	}

	function statesAreEquivalent(stateA, stateB) {
		const { create, destroy } = stateChangeLogic(
			compareStartAndEndStates({
				original: stateA,
				destination: stateB,
			}),
		)

		return create.length === 0 && destroy.length === 0
	}

	function allowStateChangeOrRevert(newStateName, newParameters) {
		const lastState = lastCompletelyLoadedState.get()
		if (lastState.name && statesAreEquivalent(lastState, lastStateStartedActivating.get())) {
			const { destroy } = stateChangeLogic(
				compareStartAndEndStates({
					original: lastState,
					destination: {
						name: newStateName,
						parameters: newParameters,
					},
				}),
			)

			const canLeaveStates = destroy.every(stateName => {
				const state = prototypalStateHolder.get(stateName)
				if (state.canLeaveState && typeof state.canLeaveState === 'function') {
					const stateChangeAllowed = state.canLeaveState(activeDomApis[stateName], {
						name: newStateName,
						parameters: newParameters,
					})
					if (!stateChangeAllowed) {
						stateProviderEmitter.emit('stateChangePrevented', {
							name: stateName,
							parameters: lastState.parameters,
						}, {
							name: newStateName,
							parameters: newParameters,
						})
					}
					return stateChangeAllowed
				}
				return true
			})

			if (!canLeaveStates) {
				stateProviderEmitter.go(lastState.name, lastState.parameters, { replace: true })
			}
			return canLeaveStates
		}
		return true
	}

	function onRouteChange(state, parameters) {
		try {
			const finalDestinationStateName = prototypalStateHolder.applyDefaultChildStates(state.name)

			if (finalDestinationStateName === state.name && allowStateChangeOrRevert(state.name, parameters)) {
				emitEventAndAttemptStateChange(finalDestinationStateName, parameters)
			} else if (finalDestinationStateName !== state.name) {
				// There are default child states that need to be applied

				const theRouteWeNeedToEndUpAt = makePath(finalDestinationStateName, parameters)
				const currentRoute = router.location.get()

				if (theRouteWeNeedToEndUpAt !== currentRoute) {
					// change the url to match the full default child state route
					stateProviderEmitter.go(finalDestinationStateName, parameters, { replace: true })
				} else if (allowStateChangeOrRevert(finalDestinationStateName, parameters)) {
					// the child state has the same route as the current one, just start navigating there
					emitEventAndAttemptStateChange(finalDestinationStateName, parameters)
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

	async function attemptStateChange(newStateName, parameters, transition) {
		function ifNotCancelled(fn) {
			return (...args) => {
				if (transition.cancelled) {
					const err = new Error(`The transition to ${newStateName} was cancelled`)
					err.wasCancelledBySomeoneElse = true
					throw err
				} else {
					return fn(...args)
				}
			}
		}

		try {
			await prototypalStateHolder.guaranteeAllStatesExist(newStateName)

			const state = prototypalStateHolder.get(newStateName)
			const defaultParams = state.defaultParameters || state.defaultQuerystringParameters || {}
			const needToApplyDefaults = Object.keys(defaultParams).some(param => typeof parameters[param] === 'undefined')

			if (needToApplyDefaults) {
				throw redirector(newStateName, { ...computeDefaultParams(defaultParams), ...parameters })
			}

			await ifNotCancelled(() => {
				stateProviderEmitter.emit(
					`stateChangeStart`,
					state,
					parameters,
					stateNameToArrayofStates(state.name),
				)
				lastStateStartedActivating.set(state.name, parameters)
			})()

			const stateComparisonResults = compareStartAndEndStates({
				original: lastCompletelyLoadedState.get(),
				destination: {
					name: newStateName,
					parameters,
				},
			})

			const stateChanges = await stateChangeLogic(stateComparisonResults)

			const stateResolveResultsObject = await ifNotCancelled(async() => {
				try {
					return await resolveStates(getStatesToResolve(stateChanges), { ...parameters })
				} catch (e) {
					e.stateChangeError = true
					throw e
				}
			})()

			await ifNotCancelled(async() => {
				transition.cancellable = false

				const activateAll = () => activateStates(stateChanges.create)

				await series(reverse(stateChanges.destroy), destroyStateName)
				activeStateResolveContent = { ...activeStateResolveContent, ...stateResolveResultsObject }
				await renderAll(stateChanges.create, { ...parameters })
				activateAll()
			})()

			lastCompletelyLoadedState.set(newStateName, parameters)

			try {
				stateProviderEmitter.emit(
					`stateChangeEnd`,
					prototypalStateHolder.get(newStateName),
					parameters,
					stateNameToArrayofStates(newStateName),
				)
			} catch (e) {
				handleError(`stateError`, e)
			}
		} catch (err) {
			if (transition.cancelled && err.wasCancelledBySomeoneElse) {
				// Silently handle cancellations by others
			} else if (err.redirectTo) {
				stateProviderEmitter.emit(`stateChangeCancelled`, err)
				await stateProviderEmitter.go(err.redirectTo.name, err.redirectTo.params, { replace: true })
			} else {
				handleError(`stateChangeError`, err)
			}
		}

		function activateStates(stateNames) {
			stateNames.map(prototypalStateHolder.get).forEach(state => {
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
	}

	function makePath(stateName, parameters, options) {
		function getGuaranteedPreviousState() {
			if (!lastStateStartedActivating.get().name) {
				throw new Error(`makePath required a previous state to exist, and none was found`)
			}
			return lastStateStartedActivating.get()
		}
		if (options && options.inherit) {
			parameters = { ...(getGuaranteedPreviousState().parameters), ...parameters }
		}

		const destinationStateName = stateName === null ? getGuaranteedPreviousState().name : stateName

		const destinationState = prototypalStateHolder.get(destinationStateName) || {}
		const defaultParams = destinationState.defaultParameters || destinationState.defaultQuerystringParameters || {}

		parameters = { ...computeDefaultParams(defaultParams), ...parameters }

		prototypalStateHolder.guaranteeAllStatesExist(destinationStateName)
		const route = prototypalStateHolder.buildFullStateRoute(destinationStateName)
		return buildPath(route, parameters || {})
	}

	const defaultOptions = {
		replace: false,
	}

	stateProviderEmitter.addState = addState
	stateProviderEmitter.go = async(newStateName, parameters, options) => {
		options = { ...defaultOptions, ...options }
		const goFunction = options.replace ? router.replace : router.go

		try {
			const path = makePath(newStateName, parameters, options)
			await goFunction(path)
		} catch (err) {
			handleError(`stateChangeError`, err)
		}
	}
	// eslint-disable-next-line require-await
	stateProviderEmitter.evaluateCurrentRoute = async(defaultState, defaultParams) => {
		try {
			const defaultPath = makePath(defaultState, defaultParams)
			router.evaluateCurrent(defaultPath)
		} catch (err) {
			handleError(`stateError`, err)
		}
	}
	stateProviderEmitter.makePath = (stateName, parameters, options) => pathPrefix + makePath(stateName, parameters, options)
	stateProviderEmitter.getActiveState = () => lastCompletelyLoadedState.get()
	stateProviderEmitter.stateIsActive = (stateName = null, parameters = null) => {
		const currentState = lastCompletelyLoadedState.get()
		const stateNameMatches = currentState.name === stateName
			|| currentState.name.indexOf(`${stateName }.`) === 0
			|| stateName === null
		const parametersWereNotPassedIn = !parameters

		return stateNameMatches
			&& (parametersWereNotPassedIn || Object.keys(parameters).every(key => `${ parameters[key] }` === currentState.parameters[key]))
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
		.reduce((obj, stateName) => {
			return { ...obj, ...stateResolveResultsObject[stateName] }
		}, {})
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
async function resolveStates(states, parameters) {
	const statesWithResolveFunctions = states.filter(isFunction(`resolve`))
	const stateNamesWithResolveFunctions = statesWithResolveFunctions.map(getProperty(`name`))

	const resolveResults = await Promise.all(statesWithResolveFunctions.map(state => state.resolve(state.data, parameters)))

	return combine({
		stateName: stateNamesWithResolveFunctions,
		resolveResult: resolveResults,
	}).reduce((obj, result) => {
		obj[result.stateName] = result.resolveResult
		return obj
	}, {})
}
