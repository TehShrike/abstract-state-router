import test from 'tape-catch'
import StateState from '../lib/state-state.js'

/*
stateState.add
stateState.get
*/
const addGetTests = (() => {
	const nameStateMessageSets = [
		{ name: `rofl`, state: `hey`, message: `add a state` },
		{ name: `rofl`, state: { sup: `cool` }, message: `overwrite a state` },
		{ name: `rofl`, state: { sup: `cool` }, message: `overwrite with itself` },
		{ name: `what`, state: `wat`, message: `add more states` },
		{ name: `cool`, state: `nice`, message: `even more states` },
	]

	function AddGet(t, ss) {
		return function ag(set) {
			ss.add(set.name, set.state)

			t.equal(ss.get(set.name), set.state, set.message)
		}
	}

	return {
		sets: nameStateMessageSets,
		fn: AddGet,
		name: `stateState.add | stateState.get`,
	}
})()

/*
stateState.getParentName
stateState.getParent
*/
const parentTests = (() => {
	const childParentSets = [
		{ child: `rofl.haha.lolz`, parent: `rofl.haha` },
		{ child: `rofl.lolz.lolz`, parent: `rofl.lolz` },
		{ child: `noparent`, parent: null },
		{ child: `can haz spaces?`, parent: null },
		{ child: `yes. u can. rly`, parent: `yes. u can` },
		{ child: `somethin silly.`, parent: `somethin silly` },
	]

	function GetParentName(t, ss) {
		return function agpn(set) {
			ss.add(set.child, `some state`)

			const apparently = ss.getParentName(set.child)

			const msg = `parent of "${ set.child }" is "${ set.parent }"`
			t.equal(apparently, set.parent, msg)
		}
	}
	return {
		sets: childParentSets,
		fn: GetParentName,
		name: `stateState.getParentName`,
	}
})()

/*
stateState.buildFullStateRoute
*/
const buildTests = (() => {
	const stateRouteSets = [ {
		add: [
			{ name: `a`, state: { route: `copter` } },
			{ name: `a.b`, state: { route: `rofl` } },
			{ name: `a.b.c`, state: { route: `um` } },
		],
		route: `a.b.c`,
		expect: `/copter/rofl/um`,
		message: `no leading slashes`,
	}, {
		add: [
			{ name: `a`, state: { route: `/copter` } },
			{ name: `a.b`, state: { route: `laugh` } },
			{ name: `a.b.c`, state: { route: `/um` } },
		],
		route: `a.b.c`,
		expect: `/copter/laugh/um`,
		message: `some leading slashes`,
	}, {
		add: [
			{ name: `a`, state: { route: `/copter` } },
			{ name: `a.b`, state: { route: `/rofl` } },
			{ name: `a.b.c`, state: { route: `/um` } },
		],
		route: `a.b.c`,
		expect: `/copter/rofl/um`,
		message: `all leading slashes`,
	}, {
		add: [
			{ name: `a`, state: { route: `/copter` } },
			{ name: `a.b`, state: `not a real route` },
			{ name: `a.b.c`, state: { route: `lol` } },
		],
		route: `a.b.c`,
		expect: `/copter/lol`,
		message: `some states lacking a state.route`,
	}, {
		add: [
			{ name: `a`, state: `i haz no route lol` },
			{ name: `a.b`, state: `not a route here` },
			{ name: `a.b.c`, state: `and not here!!` },
		],
		route: `a.b.c`,
		expect: `/`,
		message: `all states lacking a state.route`,
	}, {
		add: [ { name: `a`, state: `not a route here` } ],
		route: `a`,
		expect: `/`,
		message: `single state lacks a state.route`,
	}, {
		add: [
			{ name: `a`, state: { route: `///um` } },
			{ name: `a.b`, state: { route: `///` } },
		],
		route: `a`,
		expect: `/um`,
		message: `multiple concurrent slashes are deleted`,
	} ]

	function Build(t, ss) {
		return function bld(set) {
			set.add.forEach(add => {
				ss.add(add.name, add.state)
			})
			const route = ss.buildFullStateRoute(set.route)
			t.equal(route, set.expect, set.message)
		}
	}

	return {
		sets: stateRouteSets,
		fn: Build,
		name: `stateState.buildFullStateRoute`,
	}
})()

/*
stateState.applyDefaultChildStates
*/
const defaultChildTests = (() => {
	const defaultChildSets = [ {
		add: [
			{ name: `a`, state: { defaultChild: `b` } },
			{ name: `a.b`, state: { defaultChild: `c` } },
			{ name: `a.b.c`, state: { defaultChild: `d` } },
		],
		expect: `a.b.c.d`,
		message: `all default children are strings`,
	}, {
		add: [
			{ name: `a`, state: { defaultChild: () => `b` } },
			{ name: `a.b`, state: { defaultChild: () => `c` } },
			{ name: `a.b.c`, state: { defaultChild: () => `d` } },
		],
		expect: `a.b.c.d`,
		message: `all default children are functions`,
	}, {
		add: [
			{ name: `a`, state: { defaultChild: `b` } },
			{ name: `a.b`, state: { defaultChild: () => `c` } },
			{ name: `a.b.c`, state: { defaultChild: `d` } },
		],
		expect: `a.b.c.d`,
		message: `some functions, some strings`,
	}, {
		add: [
			{ name: `a`, state: { defaultChild: `b` } },
			{ name: `a.b`, state: `not a real defaultChild` },
			{ name: `a.b.c`, state: { defaultChild: `d` } },
		],
		expect: `a.b`,
		message: `some states lacking a state.defaultChild`,
	}, {
		add: [
			{ name: `a`, state: `i haz no defaultChild lol` },
			{ name: `a.b`, state: `not a defaultChild here` },
		],
		expect: `a`,
		message: `all states lacking a state.defaultChild`,
	} ]

	function DefaultChild(t, ss) {
		return function bld(set) {
			const rootStateName = set.add[0].name
			set.add.forEach(add => {
				ss.add(add.name, add.state)
			})
			const applied = ss.applyDefaultChildStates(rootStateName)
			t.equal(applied, set.expect, set.message)
		}
	}

	return {
		sets: defaultChildSets,
		fn: DefaultChild,
		name: `stateState.applyDefaultChildStates`,
	}
})()

/*
Run all the above tests...
*/
const allTests = [].concat(
	addGetTests,
	parentTests,
	buildTests,
	defaultChildTests,
)

test(`test state-state`, tt => {
	allTests.forEach(thisTest => {
		tt.test(thisTest.name, t => {
			const fn = thisTest.fn(t, StateState())
			thisTest.sets.forEach(fn)

			t.end()
		})
	})
	tt.end()
})

/*
stateState.guaranteeAllStatesExist
*/
test(`guaranteeAllStatesExist`, t => {
	let ss = null
	t.plan(2)

	ss = StateState()
	ss.add(`a`, `hahaha`)
	ss.add(`a.b`, `rofl`)
	ss.add(`a.b.c`, `um`)
	t.doesNotThrow(() => {
		ss.guaranteeAllStatesExist(`a.b.c`)
	}, /lolz/, `doesn\t throw when state exists`)

	ss = StateState()
	ss.add(`a`, `hahaha`)
	ss.add(`a.b.c`, `um`)
	t.throws(() => {
		ss.guaranteeAllStatesExist(`a.b.c`)
	}, /a\.b.+exist/, `Throws when an intermediate state doesn't exist`)

	t.end()
})
