var test = require('tape')
var StateState = require('../state-state')


var nameStateMessageSets = [
	{name: 'rofl', state: 'hey', message: 'add a state'},
	{name: 'rofl', state: {sup: 'cool'}, message: 'overwrite a state'},
	{name: 'rofl', state: {sup: 'cool'}, message: 'overwrite with itself'},
	{name: 'what', state: 'wat', message: 'add more states'},
	{name: 'cool', state: 'nice', message: 'even more states'}
]
var childParentSets = [
	{child: 'rofl.haha.lolz',  parent: 'rofl.haha'},
	{child: 'rofl.lolz.lolz',  parent: 'rofl.lolz'},
	{child: 'noparent',        parent: null},
	{child: 'can haz spaces?', parent: null},
	{child: 'yes. u can. rly', parent: 'yes. u can'},
	{child: 'somethin silly.', parent: 'somethin silly'}
]


function AddGet(t, ss) {
	return function ag(set) {
		ss.add(set.name, set.state)

		t.equal(ss.get(set.name), set.state, set.message)
	}
}
function GetParentName(t, ss) {	
	return function agpn(set) {
		ss.add(set.child, 'some state')

		var apparently = ss.getParentName(set.child)

		var msg = 'parent of "' + set.child + '" is "' + set.parent + '"'
		t.equal(apparently, set.parent, msg)
	}
}
function GetParent(t, ss) {
	return function (set) {
		var unique = Math.random().toString().slice(2)
		ss.add(set.parent, unique)
		ss.add(set.child, 'child state')

		var apparentState = ss.getParent(set.child)
		var parentState = ss.get(set.parent)

		var msg = 'found parent state of ' + set.child
		t.equal(parentState, apparentState, msg)
	}
}


var allTests = [
	{
		sets: nameStateMessageSets,
		fn: AddGet,
		name: 'stateState.add | stateState.get'
	}, {
		sets: childParentSets,
		fn: GetParentName,
		name: 'stateState.getParentName'
	}, {
		sets: childParentSets,
		fn: GetParent,
		name: 'stateState.getParent'
	}
]

test('test state-state', function(tt) {
	allTests.forEach(function(thisTest) {
		tt.test(thisTest.name, function(t) {
			var fn = thisTest.fn(t, StateState())
			thisTest.sets.forEach( fn )

			t.end()
		})
	})
	tt.end()
})
