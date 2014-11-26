module.exports = function(stateComparisonResults) {
	var hitChangingState = false
	var hitDestroyedState = false

	var output = {
		destroy: [],
		change: [],
		create: []
	}

	stateComparisonResults.forEach(function(state) {
		hitChangingState = hitChangingState || state.stateParametersChanged
		hitDestroyedState = hitDestroyedState || state.stateNameChanged

		if (state.nameBefore) {
			if (hitDestroyedState) {
				output.destroy.push(state.nameBefore)
			} else if (hitChangingState) {
				output.change.push(state.nameBefore)
			}
		}

		if (state.nameAfter && hitDestroyedState) {
			output.create.push(state.nameAfter)
		}
	})

	return output
}
