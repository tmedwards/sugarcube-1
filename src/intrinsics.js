/***********************************************************************************************************************
 *
 * intrinsics.js
 *
 * Copyright © 2013–2015 Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
 * Use of this source code is governed by a Simplified BSD License which can be found in the LICENSE file.
 *
 **********************************************************************************************************************/

/***********************************************************************************************************************
 * Polyfills
 **********************************************************************************************************************/
/**
 * Returns the array status of the given variable
 */
if (!Array.isArray) {
	Object.defineProperty(Array, "isArray", {
		configurable : true,
		writable     : true,
		value        : function (obj) {
			"use strict";
			return Object.prototype.toString.call(obj) === "[object Array]";
		}
	});
}

/**
 * Returns the first index at which an element can be found within the array, or -1 if it is not present
 */
if (!Array.prototype.indexOf) {
	Object.defineProperty(Array.prototype, "indexOf", {
		configurable : true,
		writable     : true,
		value        : function (needle, from) {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("Array.prototype.indexOf called on null or undefined");
			}

			var	list   = Object(this),
				length = list.length >>> 0;

			from = +from || 0;
			if (!isFinite(from)) {
				from = 0;
			}
			if (from < 0) {
				from += length;
				if (from < 0) {
					from = 0;
				}
			}

			for (/* empty*/; from < length; from++) {
				if (list[from] === needle) {
					return from;
				}
			}
			return -1;
		}
	});
}

/**
 * Creates a new array with all elements that pass the test implemented by the provided function
 */
if (!Array.prototype.filter) {
	Object.defineProperty(Array.prototype, "filter", {
		configurable : true,
		writable     : true,
		value        : function (filterFn /* [, thisp] */) {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("Array.prototype.filter called on null or undefined");
			}
			if (typeof filterFn !== "function") {
				throw new TypeError("Array.prototype.filter callback parameter must be a function");
			}

			var	list   = Object(this),
				length = list.length >>> 0,
				res    = [],
				thisp  = arguments[1];

			for (var i = 0; i < length; i++) {
				if (i in list) {
					var val = list[i];
					if (filterFn.call(thisp, val, i, list)) {
						res.push(val);
					}
				}
			}
			return res;
		}
	});
}

/**
 * Returns a value from the array, if an element in the array satisfies the provided testing function, otherwise undefined is returned
 */
if (!Array.prototype.find) {
	Object.defineProperty(Array.prototype, "find", {
		configurable : true,
		writable     : true,
		value        : function (callback /* [, thisp] */) {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("Array.prototype.find called on null or undefined");
			}
			if (typeof callback !== "function") {
				throw new TypeError("Array.prototype.find callback parameter must be a function");
			}

			var	list   = Object(this),
				length = list.length >>> 0,
				thisp  = arguments[1];

			for (var i = 0; i < length; i++) {
				if (i in list) {
					var val = list[i];
					if (callback.call(thisp, val, i, list)) {
						return val;
					}
				}
			}
			return undefined;
		}
	});
}

/**
 * Executes the provided function once per array element
 */
if (!Array.prototype.forEach) {
	Object.defineProperty(Array.prototype, "forEach", {
		configurable : true,
		writable     : true,
		value        : function (callback /* [, thisp] */) {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("Array.prototype.forEach called on null or undefined");
			}
			if (typeof callback !== "function") {
				throw new TypeError("Array.prototype.forEach callback parameter must be a function");
			}

			var	list   = Object(this),
				length = list.length >>> 0,
				thisp  = arguments[1];

			for (var i = 0; i < length; i++) {
				if (i in list) {
					var val = list[i];
					callback.call(thisp, val, i, list);
				}
			}
			return undefined;
		}
	});
}

/**
 * Returns whether the given element was found within the array
 */
if (!Array.prototype.includes) {
	Object.defineProperty(Array.prototype, "includes", {
		configurable : true,
		writable     : true,
		value        : function (/* needle [, fromIndex] */) {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("Array.prototype.includes called on null or undefined");
			}

			return Array.prototype.indexOf.apply(this, arguments) !== -1;
		}
	});
}

/**
 * Creates a new array with the results of calling a provided function on every element in the array
 */
if (!Array.prototype.map) {
	Object.defineProperty(Array.prototype, "map", {
		configurable : true,
		writable     : true,
		value        : function (callback /* [, thisp] */) {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("Array.prototype.map called on null or undefined");
			}
			if (typeof callback !== "function") {
				throw new TypeError("Array.prototype.map callback parameter must be a function");
			}

			var	list   = Object(this),
				length = list.length >>> 0,
				res    = new Array(length),
				thisp  = arguments[1];

			for (var i = 0; i < length; i++) {
				if (i in list) {
					var val = list[i];
					res[i] = callback.call(thisp, val, i, list);
				}
			}
			return res;
		}
	});
}

/**
 * Tests whether some element in the array passes the test implemented by the provided function
 */
if (!Array.prototype.some) {
	Object.defineProperty(Array.prototype, "some", {
		configurable : true,
		writable     : true,
		value        : function (callback /* [, thisp] */) {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("Array.prototype.some called on null or undefined");
			}
			if (typeof callback !== "function") {
				throw new TypeError("Array.prototype.some callback parameter must be a function");
			}

			var	list   = Object(this),
				length = list.length >>> 0,
				thisp  = arguments[1];

			for (var i = 0; i < length; i++) {
				if (i in list) {
					var val = list[i];
					if (callback.call(thisp, val, i, list)) {
						return true;
					}
				}
			}
			return false;
		}
	});
}

/**
 * Returns the number of milliseconds elapsed since the JavaScript epoch
 */
if (!Date.now) {
	Object.defineProperty(Date, "now", {
		configurable : true,
		writable     : true,
		value        : function () {
			"use strict";
			return new Date().getTime();
		}
	});
}

/**
 * Returns the integral part of a number by removing any fractional digits, it does not round
 */
if (!Math.trunc) {
	Object.defineProperty(Math, "trunc", {
		configurable : true,
		writable     : true,
		value        : function (num) {
			"use strict";
			return (num < 0) ? Math.ceil(num) : Math.floor(num);
		}
	});
}

/**
 * Returns whether the given search string was found within the string
 */
if (!String.prototype.includes) {
	Object.defineProperty(String.prototype, "includes", {
		configurable : true,
		writable     : true,
		value        : function (/* needle [, fromIndex] */) {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("String.prototype.includes called on null or undefined");
			}

			return String.prototype.indexOf.apply(this, arguments) !== -1;
		}
	});
}

/**
 * Returns a copy of the base string with 'count' characters replaced with 'replacement', starting at 'start'
 */
if (!String.prototype.splice) {
	Object.defineProperty(String.prototype, "splice", {
		configurable : true,
		writable     : true,
		value        : function (start, count, replacement) {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("String.prototype.splice called on null or undefined");
			}

			var length = this.length >>> 0;

			if (length === 0) {
				return "";
			}

			start = +start || 0;
			if (!isFinite(start)) {
				start = 0;
			} else if (start < 0) {
				start += length;
				if (start < 0) {
					start = 0;
				}
			}
			if (start > length) {
				start = length;
			}

			count = +count || 0;
			if (!isFinite(count) || count < 0) {
				count = 0;
			}

			var res = this.slice(0, start);
			if (typeof replacement !== "undefined") {
				res += replacement;
			}
			if ((start + count) < length) {
				res += this.slice(start + count);
			}
			return res;
		}
	});
}

/**
 * Returns a string with all whitespace removed from both sides of the string
 */
if (!String.prototype.trim) {
	Object.defineProperty(String.prototype, "trim", {
		configurable : true,
		writable     : true,
		value        : function () {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("String.prototype.trim called on null or undefined");
			}

			//return this.replace(/^\s+/, "").replace(/\s+$/, "");
			return this.replace(/^\s+|\s+$/g, "");
		}
	});
}

/**
 * Returns a string with all whitespace removed from the left side of the string
 */
if (!String.prototype.trimLeft) {
	Object.defineProperty(String.prototype, "trimLeft", {
		configurable : true,
		writable     : true,
		value        : function () {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("String.prototype.trimLeft called on null or undefined");
			}

			return this.replace(/^\s+/, "");
		}
	});
}

/**
 * Returns a string with all whitespace removed from the right side of the string
 */
if (!String.prototype.trimRight) {
	Object.defineProperty(String.prototype, "trimRight", {
		configurable : true,
		writable     : true,
		value        : function () {
			"use strict";
			if (this == null) { // use lazy equality
				throw new TypeError("String.prototype.trimRight called on null or undefined");
			}

			return this.replace(/\s+$/, "");
		}
	});
}

/**
 * If Object.create isn't already defined, we just do the simple shim, without the second argument, since that's all we need here
 */
if (!Object.create || typeof Object.create !== "function") {
	Object.defineProperty(Object, "create", {
		configurable : true,
		writable     : true,
		value        : (function () {
			function F () {}

			return function (proto) {
				"use strict";
				if (arguments.length !== 1) {
					throw new Error("polyfill Object.create implementation only accepts one parameter");
				}
				if (proto == null) { // use lazy equality
					throw new TypeError("Object.create proto parameter is null or undefined");
				}
				if (typeof proto !== "object") {
					throw new TypeError("Object.create proto parameter must be an object");
				}

				F.prototype = proto;
				return new F();
			};
		}())
	});
}


/***********************************************************************************************************************
 * Extensions, General
 **********************************************************************************************************************/
/**
 * Returns a random value from the given array in the range of lower and upper, if they are specified
 */
Object.defineProperty(Array, "random", {
	configurable : true,
	writable     : true,
	value        : function (array, lower, upper) {
		"use strict";
		if (arguments.length === 2) {
			upper = lower;
			lower = 0;
		}
		if (Array.isArray(array)) {
			return array.random(lower, upper);
		} else if (array.hasOwnProperty("length")) {
			return Array.prototype.slice.call(array, 0).random(lower, upper);
		}
		return undefined;
	}
});

/**
 * Returns whether the given element was found within the array
 */
Object.defineProperty(Array.prototype, "contains", {
	configurable : true,
	writable     : true,
	value        : function (/* needle [, fromIndex] */) {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("Array.prototype.contains called on null or undefined");
		}

		return Array.prototype.indexOf.apply(this, arguments) !== -1;
	}
});

/**
 * Returns whether all of the given elements were found within the array
 */
Object.defineProperty(Array.prototype, "containsAll", {
	configurable : true,
	writable     : true,
	value        : function (/* needles */) {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("Array.prototype.containsAll called on null or undefined");
		}

		if (arguments.length === 1) {
			if (Array.isArray(arguments[0])) {
				return Array.prototype.containsAll.apply(this, arguments[0]);
			} else {
				return Array.prototype.indexOf.apply(this, arguments) !== -1;
			}
		} else {
			for (var i = 0, iend = arguments.length; i < iend; i++) {
				if (!Array.prototype.some.call(this, function (v) { return v === this.val; }, { val: arguments[i] })) {
					return false;
				}
			}
			return true;
		}
	}
});

/**
 * Returns whether any of the given elements were found within the array
 */
Object.defineProperty(Array.prototype, "containsAny", {
	configurable : true,
	writable     : true,
	value        : function (/* needles */) {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("Array.prototype.containsAny called on null or undefined");
		}

		if (arguments.length === 1) {
			if (Array.isArray(arguments[0])) {
				return Array.prototype.containsAny.apply(this, arguments[0]);
			} else {
				return Array.prototype.indexOf.apply(this, arguments) !== -1;
			}
		} else {
			for (var i = 0, iend = arguments.length; i < iend; i++) {
				if (Array.prototype.some.call(this, function (v) { return v === this.val; }, { val: arguments[i] })) {
					return true;
				}
			}
			return false;
		}
	}
});

/**
 * Returns the number of times the given element was found within the array
 */
Object.defineProperty(Array.prototype, "count", {
	configurable : true,
	writable     : true,
	value        : function (/* needle [, fromIndex ] */) {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("Array.prototype.count called on null or undefined");
		}

		var	indexOf = Array.prototype.indexOf,
			needle  = arguments[0],
			pos     = Number(arguments[1] || 0),
			count   = 0;

		while ((pos = indexOf.call(this, needle, pos)) !== -1) {
			count++;
			pos++;
		}
		return count;
	}
});

/**
 * Removes and returns a random value from the array in the range of lower and upper, if they are specified
 */
Object.defineProperty(Array.prototype, "pluck", {
	configurable : true,
	writable     : true,
	value        : function (lower, upper) {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("Array.prototype.pluck called on null or undefined");
		}
		if (this.length === 0) {
			return;
		}

		if (arguments.length === 1) {
			upper = lower;
			lower = 0;
		}
		if (lower == null) { // use lazy equality
			lower = 0;
		} else if (lower < 0) {
			lower = 0;
		} else if (lower >= this.length) {
			lower = this.length - 1;
		}
		if (upper == null) { // use lazy equality
			upper = this.length - 1;
		} else if (upper < 0) {
			upper = 0;
		} else if (upper >= this.length) {
			upper = this.length - 1;
		}
		return Array.prototype.splice.call(this, random(lower, upper), 1)[0];
	}
});

/**
 * Returns a random value from the array in the range of lower and upper, if they are specified
 */
Object.defineProperty(Array.prototype, "random", {
	configurable : true,
	writable     : true,
	value        : function (lower, upper) {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("Array.prototype.random called on null or undefined");
		}
		if (this.length === 0) {
			return;
		}

		if (arguments.length === 1) {
			upper = lower;
			lower = 0;
		}
		if (lower == null) { // use lazy equality
			lower = 0;
		} else if (lower < 0) {
			lower = 0;
		} else if (lower >= this.length) {
			lower = this.length - 1;
		}
		if (upper == null) { // use lazy equality
			upper = this.length - 1;
		} else if (upper < 0) {
			upper = 0;
		} else if (upper >= this.length) {
			upper = this.length - 1;
		}
		return this[random(lower, upper)];
	}
});

/**
 * Randomly shuffles the array
 */
Object.defineProperty(Array.prototype, "shuffle", {
	configurable : true,
	writable     : true,
	value        : function () {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("Array.prototype.shuffle called on null or undefined");
		}
		if (this.length === 0) {
			return;
		}

		for (var i = this.length - 1; i > 0; i--) {
			var	j    = Math.floor(Math.random() * (i + 1)),
				swap = this[i];
			this[i] = this[j];
			this[j] = swap;
		}
		return this;
	}
});

/**
 * Returns a bound function that supplies the given arguments to the base function, followed
 * by the arguments are supplied to the bound function, whenever it is called
 */
Object.defineProperty(Function.prototype, "partial", {
	configurable : true,
	writable     : true,
	value        : function (/* variadic */) {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("Function.prototype.partial called on null or undefined");
		}

		var	slice = Array.prototype.slice,
			fn    = this,
			bound = slice.call(arguments, 0);
		return function () {
			var	applied = [],
				argc    = 0;
			for (var i = 0; i < bound.length; i++) {
				applied.push(bound[i] === undefined ? arguments[argc++] : bound[i]);
			}
			return fn.apply(this, applied.concat(slice.call(arguments, argc)));
		};
	}
});

/**
 * Returns the given numerical clamped to the specified bounds
 */
Object.defineProperty(Math, "clamp", {
	configurable : true,
	writable     : true,
	value        : function (num, min, max) {
		"use strict";
		num = Number(num);
		return isNaN(num) ? NaN : num.clamp(min, max);
	}
});

/**
 * Returns a decimal number eased from 0 to 1
 *   n.b. The magnitude of the returned value decreases if num < 0.5 or increases if num > 0.5
 */
Object.defineProperty(Math, "easeInOut", {
	configurable : true,
	writable     : true,
	value        : function (num) {
		"use strict";
		num = Number(num);
		return (1 - ((Math.cos(num * Math.PI) + 1) / 2));
	}
});

/**
 * Returns the number clamped to the specified bounds
 */
Object.defineProperty(Number.prototype, "clamp", {
	configurable : true,
	writable     : true,
	value        : function (min, max) {
		"use strict";
		var num = Number(this);
		if (num < min) { num = min; }
		if (num > max) { num = max; }
		return num;
	}
});

/**
 * Returns a copy of the given string with all RegExp metacharacters escaped
 */
Object.defineProperty(RegExp, "escape", {
	configurable : true,
	writable     : true,
	value        : function (str) {
		"use strict";
		return String(str).replace(/[-.*+?^${}()|\[\]\/\\]/g, "\\$&");
	}
});

/**
 * Returns a formatted string, after replacing each format item in the given format string
 * with the text equivalent of the corresponding argument's value
 */
Object.defineProperty(String, "format", {
	configurable : true,
	writable     : true,
	value        : function (format) {
		"use strict";
		function padString(str, align, pad) {
			if (!align) {
				return str;
			}
			var plen = Math.abs(align) - str.length;
			if (plen < 1) {
				return str;
			}
			var padding = Array(plen + 1).join(pad);
			return (align < 0) ? str + padding : padding + str;
		}

		if (arguments.length < 2) {
			return (arguments.length === 0) ? "" : format;
		}

		var args = (arguments.length === 2 && Array.isArray(arguments[1]))
			? arguments[1].slice(0)
			: Array.prototype.slice.call(arguments, 1);

		if (args.length === 0) {
			return format;
		}

		return format.replace(/{(\d+)(?:,([+-]?\d+))?}/g, function (match, index, align) {
			var retval = args[index];
			if (retval == null) { // use lazy equality
				return "";
			}
			while (typeof retval === "function") {
				retval = retval();
			}
			switch (typeof retval) {
			case "string":
				/* nothing */
				break;
			case "object":
				retval = JSON.stringify(retval);
				break;
			default:
				retval = String(retval);
				break;
			}
			return padString(retval, (!align) ? 0 : parseInt(align), " ");
		});
	}
});

/**
 * Returns whether the given string was found within the string
 */
Object.defineProperty(String.prototype, "contains", {
	configurable : true,
	writable     : true,
	value        : function (/* needle [, fromIndex] */) {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("String.prototype.contains called on null or undefined");
		}

		return String.prototype.indexOf.apply(this, arguments) !== -1;
	}
});

/**
 * Returns the number of times the given string was found within the string
 */
Object.defineProperty(String.prototype, "count", {
	configurable : true,
	writable     : true,
	value        : function (/* needle [, fromIndex ] */) {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("String.prototype.count called on null or undefined");
		}

		var needle = String(arguments[0] || "");

		if (needle === "") {
			return 0;
		}

		var	indexOf = String.prototype.indexOf,
			step    = needle.length,
			pos     = Number(arguments[1] || 0),
			count   = 0;

		while ((pos = indexOf.call(this, needle, pos)) !== -1) {
			count++;
			pos += step;
		}
		return count;
	}
});

/**
 * Returns an array of strings, split from the string, or an empty array if the string is empty
 */
Object.defineProperty(String.prototype, "splitOrEmpty", {
	configurable : true,
	writable     : true,
	value        : function (/* [ separator [, limit ]] */) {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("String.prototype.splitOrEmpty called on null or undefined");
		}
		if (String(this) === "") { // required as `this` could be a basic string, a `String` object, or the result of a `call()` or `apply()`
			return [];
		}

		return String.prototype.split.apply(this, arguments);
	}
});

/**
 * [DEPRECATED] Returns a string with all whitespace removed from the left side of the base string
 *   n.b. Just a legacy alias for String.prototype.trimLeft now
 */
Object.defineProperty(String.prototype, "ltrim", {
	configurable : true,
	writable     : true,
	value        : String.prototype.trimLeft
});

/**
 * [DEPRECATED] Returns a string with all whitespace removed from the right side of the base string
 *   n.b. Just a legacy alias for String.prototype.trimRight now
 */
Object.defineProperty(String.prototype, "rtrim", {
	configurable : true,
	writable     : true,
	value        : String.prototype.trimRight
});

/**
 * Returns an array of link titles, parsed from the string
 *   n.b. Unused in SugarCube, only included for compatibility
 */
Object.defineProperty(String.prototype, "readBracketedList", {
	configurable : true,
	writable     : true,
	value        : function () {
		"use strict";
		if (this == null) { // use lazy equality
			throw new TypeError("String.prototype.readBracketedList called on null or undefined");
		}

		// RegExp groups: Double-square-bracket quoted | Unquoted
		var	re    = new RegExp("(?:\\[\\[((?:\\s|\\S)*?)\\]\\])|([^\"'\\s]\\S*)", "gm"), //"(?:\\[\\[([^\\]]+)\\]\\])|([^\\s$]+)"
			match,
			names = [];
		while ((match = re.exec(this)) !== null) {
			if (match[1]) {
				// Double-square-bracket quoted
				names.push(match[1]);
			} else if (match[2]) {
				// Unquoted
				names.push(match[2]);
			}
		}
		return names;
	}
});


/***********************************************************************************************************************
 * Extensions, JSON/serialization
 **********************************************************************************************************************/
/**
 * Define toJSON methods on each prototype we want to support
 */
Object.defineProperty(Function.prototype, "toJSON", {
	configurable : true,
	writable     : true,
	value        : function () { return JSON.reviveWrapper(this.toString()); }
});
Object.defineProperty(RegExp.prototype, "toJSON", {
	configurable : true,
	writable     : true,
	value        : function () { return JSON.reviveWrapper(this.toString()); }
});
Object.defineProperty(Date.prototype, "toJSON", {
	configurable : true,
	writable     : true,
	value        : function () { return JSON.reviveWrapper('new Date("' + this.toISOString() + '")'); }
});

/**
 * Utility method to allow users to easily wrap their code in the revive wrapper
 */
Object.defineProperty(JSON, "reviveWrapper", {
	configurable : true,
	writable     : true,
	value        : function (code) {
		if (typeof code !== "string") { throw new TypeError("JSON.reviveWrapper code parameter must be a string"); }
		return "@@revive@@(" + code + ")";
	}
});

/**
 * Backup the original JSON.parse and replace it with a revive wrapper aware version
 */
Object.defineProperty(JSON, "_real_parse", {
	configurable : true,
	writable     : true,
	value        : JSON.parse
});
Object.defineProperty(JSON, "parse", {
	configurable : true,
	writable     : true,
	value        : function (text, reviver) {
		"use strict";
		return JSON._real_parse(text, function (key, value) {
			if (typeof value === "string" && value.slice(0, 10) === "@@revive@@") {
				try {
					value = eval(value.slice(10));
				} catch (e) { /* noop; although, perhaps, it would be better to throw an error here */ }
			}
			if (typeof reviver === "function") {
				try {
					value = reviver(key, value);
				} catch (e) { /* noop; although, perhaps, it would be better to throw an error here */ }
			}
			return value;
		});
	}
});

