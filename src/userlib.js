/***********************************************************************************************************************
 *
 * userlib.js
 *
 * Copyright © 2013–2015 Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
 * Use of this source code is governed by a Simplified BSD License which can be found in the LICENSE file.
 *
 **********************************************************************************************************************/

/***********************************************************************************************************************
 * User Utility Functions
 **********************************************************************************************************************/
/**
 * Returns a random value from its given arguments.
 */
function either(/* variadic */) {
	if (arguments.length === 0) {
		return;
	}
	return Array.prototype.concat.apply([], arguments).random();
}

/**
 * Returns the number of turns that have passed since the last instance of the given passage occurred within the story
 * history or `-1` if it does not exist.  If multiple passages are given, returns the lowest count (which can be `-1`).
 */
function lastVisited(/* variadic */) {
	if (state.isEmpty() || arguments.length === 0) {
		return -1;
	}

	var	passages = Array.prototype.concat.apply([], arguments),
		turns;
	if (passages.length > 1) {
		turns = state.length;
		for (var i = 0, iend = passages.length; i < iend; i++) {
			turns = Math.min(turns, lastVisited(passages[i]));
		}
	} else {
		var	hist  = state.history,
			title = passages[0];
		for (turns = state.length - 1; turns >= 0; turns--) {
			if (hist[turns].title === title) { break; }
		}
		if (turns !== -1) {
			turns = state.length - 1 - turns;
		}
	}
	return turns;
}

/**
 * Returns the title of the current passage.
 */
function passage() {
	return state.active.title;
}

/**
 * Returns the title of a previous passage, either the most recent one whose title does not match that of the active
 * passage or the one at the optional offset, or an empty string, if there is no such passage.
 */
function previous(offset) {
	// legacy behavior with an offset
	if (arguments.length !== 0) {
		if (offset < 1) {
			throw new RangeError("previous offset parameter must be a positive integer greater than zero");
		}
		return (state.length > offset) ? state.peek(offset).title : "";
	}

	// new behavior without offset
	if (state.length < 2) {
		return "";
	}
	for (var i = state.length - 2; i >= 0; i--) {
		if (state.history[i].title !== state.active.title) {
			return state.history[i].title;
		}
	}
	return "";
}

/**
 * Returns a pseudo-random whole number (integer) within the range of the given bounds.
 *   n.b. Using `Math.round()` will yield a non-uniform distribution!
 */
function random(/* inclusive */ min, /* inclusive */ max) {
	if (arguments.length === 0) {
		throw new Error("random called with insufficient arguments");
	} else if (arguments.length === 1) {
		max = min;
		min = 0;
	}
	if (min > max) {
		var swap = max;
		max = min;
		min = swap;
	}

	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a pseudo-random real number (floating-point) within the range of the given bounds.
 *   n.b. Unlike with its sibling function `random()`, the `max` parameter is exclusive, not inclusive
 *        (i.e. the range goes to, but does not include, the given value).
 */
function randomFloat(/* inclusive */ min, /* exclusive */ max) {
	if (arguments.length === 0) {
		throw new Error("randomFloat called with insufficient arguments");
	} else if (arguments.length === 1) {
		max = min;
		min = 0.0;
	}
	if (min > max) {
		var swap = max;
		max = min;
		min = swap;
	}

	return (Math.random() * (max - min)) + min;
}

/**
 * Returns a new array consisting of all of the tags of the given passages.
 */
function tags(/* variadic */) {
	if (arguments.length === 0) {
		return tale.get(state.active.title).tags.slice(0);
	}

	var	passages = Array.prototype.concat.apply([], arguments),
		tags     = [];
	for (var i = 0, iend = passages.length; i < iend; i++) {
		tags = tags.concat(tale.get(passages[i]).tags);
	}
	return tags;
}

/**
 * Returns the number of passages that the player has moved through (incl. the Start passage).
 *   n.b. Passages that were visited, but have been unwound (e.g. via the browser's `Back` button or the
 *        `<<back>>` macro) are no longer part of the story history and thus do not count toward the total.
 */
function turns() {
	return state.length;
}

/**
 * Returns the number of times that the passage with the given title exists within the story history.
 * If multiple passage titles are given, returns the lowest count.
 */
function visited(/* variadic */) {
	if (state.isEmpty()) {
		return 0;
	}

	var	passages = Array.prototype.concat.apply([], (arguments.length === 0) ? [state.active.title] : arguments),
		count;
	if (passages.length > 1) {
		count = state.length;
		for (var i = 0, iend = passages.length; i < iend; i++) {
			count = Math.min(count, visited(passages[i]));
		}
	} else {
		var	hist  = state.history,
			title = passages[0];
		count = 0;
		for (var i = 0, iend = state.length; i < iend; i++) {
			if (hist[i].title === title) { count++; }
		}
	}
	return count;
}

/**
 * Returns the number of passages within the story history which are tagged with *all* of the given tags.
 */
function visitedTags(/* variadic */) {
	if (arguments.length === 0) {
		return 0;
	}

	var	list  = Array.prototype.concat.apply([], arguments),
		llen  = list.length,
		count = 0;
	for (var i = 0, iend = state.length; i < iend; i++) {
		var tags = tale.get(state.history[i].title).tags;
		if (tags.length !== 0) {
			var found = 0;
			for (var j = 0; j < llen; j++) {
				if (tags.contains(list[j])) { found++; }
			}
			if (found === llen) { count++; }
		}
	}
	return count;
}
// Vanilla story format compatibility shim
function visitedTag(/* variadic */) { return visitedTags.apply(null, arguments); }

