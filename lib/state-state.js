var stateStringParser = require('./state-string-parser')

module.exports = function StateState() {
	var states = {}

	function getHierarchy(name) {
		var names = stateStringParser(name)

		return names.map(function(name) {
			if (!states[name]) {
				throw new Error('State ' + name + ' not found')
			}
			return states[name]
		})
	}

	function getParent(name) {
		var parentName = getParentName(name)

		return parentName && states[parentName]
	}

	function getParentName(name) {
		var names = stateStringParser(name)

		if (names.length > 1) {
			var secondToLast = names.length - 2

			return names[secondToLast]
		} else {
			return null
		}
	}

	function guaranteeAllStatesExist(newStateName) {
		var stateNames = stateStringParser(newStateName)
		var statesThatDontExist = stateNames.filter(function(name) {
			return !states[name]
		})

		if (statesThatDontExist.length > 0) {
			throw new Error('State ' + statesThatDontExist[statesThatDontExist.length - 1] + ' does not exist')
		}
	}

	function buildFullStateRoute(stateName) {
		return getHierarchy(stateName).map(function(state) {
			return '/' + (state.route || '')
		}).join('').replace(/\/{2,}/g, '/')
	}

	function applyDefaultChildStates(stateName) {
		var state = states[stateName]

		function getDefaultChildStateName() {
			return state && (typeof state.defaultChild === 'function'
				? state.defaultChild()
				: state.defaultChild)
		}

		var defaultChildStateName = getDefaultChildStateName()

		if (!defaultChildStateName) {
			return stateName
		}

		var fullStateName = stateName + '.' + defaultChildStateName

		return applyDefaultChildStates(fullStateName)
	}

	function forEachState(cb) {
	    for(var key in states) {
	        if(states.hasOwnProperty(key)) {
	            cb(states[key], key)
            }
        }
    }

	return {
		add: function(name, state) {
			states[name] = state
		},
		get: function(name) {
			return name && states[name]
		},
		getHierarchy: getHierarchy,
		getParent: getParent,
		getParentName: getParentName,
		guaranteeAllStatesExist: guaranteeAllStatesExist,
		buildFullStateRoute: buildFullStateRoute,
		applyDefaultChildStates: applyDefaultChildStates,
        forEachState: forEachState
	}
}
