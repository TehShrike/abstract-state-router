// Pulled from https://github.com/joliss/promise-map-series and prettied up a bit

export default (array, iterator) => {
	let currentPromise = Promise.resolve()
	return Promise.all(
		array.map((value, i) => {
			return currentPromise = currentPromise.then(() => iterator(value, i, array))
		})
	)
}
