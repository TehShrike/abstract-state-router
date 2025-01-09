export default function stateChangeLogic(stateComparisonResults) {
	let hitDestroyedState = false

	const output = {
		destroy: [],
		create: [],
	}

	stateComparisonResults.forEach(state => {
		hitDestroyedState = hitDestroyedState || state.stateNameChanged || state.stateParametersChanged

		if (state.nameBefore && hitDestroyedState) {
			output.destroy.push(state.nameBefore)
		}

		if (state.nameAfter && hitDestroyedState) {
			output.create.push(state.nameAfter)
		}
	})

	return output
}
