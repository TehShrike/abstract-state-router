module.exports = stateString => {
	return stateString.split('.').reduce((stateNames, latestNameChunk) => {
		stateNames.push(
			stateNames.length
				? stateNames[stateNames.length - 1] + '.' + latestNameChunk
				: latestNameChunk
		)

		return stateNames
	}, [])
}
