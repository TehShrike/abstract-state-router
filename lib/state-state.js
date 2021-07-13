const stateStringParser = require(`./state-string-parser`)

module.exports = function StateState() {
	const states = {}

	function getHierarchy(name) {
		const names = stateStringParser(name)

		return names.map(name => {
			if (!states[name]) {
				throw new Error(`State ${ name } not found`)
			}
			return states[name]
		})
	}

	function getParent(name) {
		const parentName = getParentName(name)

		return parentName && states[parentName]
	}

	function getParentName(name) {
		const names = stateStringParser(name)

		if (names.length > 1) {
			const secondToLast = names.length - 2

			return names[secondToLast]
		} else {
			return null
		}
	}

	function guaranteeAllStatesExist(newStateName) {
		const stateNames = stateStringParser(newStateName)
		const statesThatDontExist = stateNames.filter(name => !states[name])

		if (statesThatDontExist.length > 0) {
			throw new Error(`State ${ statesThatDontExist[statesThatDontExist.length - 1] } does not exist`)
		}
	}

	function buildFullStateRoute(stateName) {
		return getHierarchy(stateName).map(state => `/${ state.route || `` }`)
			.join(``)
			.replace(/\/{2,}/g, `/`)
	}

	function applyDefaultChildStates(stateName) {
		const state = states[stateName]

		const defaultChildStateName = state && (
			typeof state.defaultChild === `function`
				? state.defaultChild()
				: state.defaultChild
		)

		if (!defaultChildStateName) {
			return stateName
		}

		const fullStateName = `${ stateName }.${ defaultChildStateName }`

		return applyDefaultChildStates(fullStateName)
	}


	return {
		add(name, state) {
			states[name] = state
		},
		get(name) {
			return name && states[name]
		},
		getHierarchy,
		getParent,
		getParentName,
		guaranteeAllStatesExist,
		buildFullStateRoute,
		applyDefaultChildStates,
	}
}
