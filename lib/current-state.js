export default () => {
	let current = {
		name: '',
		parameters: {},
	}

	return {
		get() {
			return current
		},
		set(name, parameters) {
			current = {
				name,
				parameters,
			}
		},
	}
}
