export default stateComparisonResults => {
	let hitChangingState = false
	let hitDestroyedState = false

	const output = {
		destroy: [],
		change: [],
		create: [],
	}

	stateComparisonResults.forEach(state => {
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
