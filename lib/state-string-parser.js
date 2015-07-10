module.exports = function(stateString) {
	return stateString.split('.').reduce(function(stateNames, latestNameChunk) {
		if (stateNames.length) {
			latestNameChunk = stateNames[stateNames.length - 1] + '.' + latestNameChunk
		}
		stateNames.push(latestNameChunk)
		return stateNames
	}, [])
}
