/***********************************************************************************************************************
 *
 * utility.js
 *
 * Copyright © 2013–2016 Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
 * Use of this source code is governed by a Simplified BSD License which can be found in the LICENSE file.
 *
 **********************************************************************************************************************/

/***********************************************************************************************************************
 * Libraries
 **********************************************************************************************************************/
/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var saveAs=saveAs||navigator.msSaveBlob&&navigator.msSaveBlob.bind(navigator)||function(e){"use strict";var t=e.document,n=function(){return e.URL||e.webkitURL||e},r=e.URL||e.webkitURL||e,i=t.createElementNS("http://www.w3.org/1999/xhtml","a"),s="download"in i,o=function(n){var r=t.createEvent("MouseEvents");r.initMouseEvent("click",true,false,e,0,0,0,0,0,false,false,false,false,0,null);n.dispatchEvent(r)},u=e.webkitRequestFileSystem,a=e.requestFileSystem||u||e.mozRequestFileSystem,f=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},l="application/octet-stream",c=0,h=[],p=function(){var e=h.length;while(e--){var t=h[e];if(typeof t==="string"){r.revokeObjectURL(t)}else{t.remove()}}h.length=0},d=function(e,t,n){t=[].concat(t);var r=t.length;while(r--){var i=e["on"+t[r]];if(typeof i==="function"){try{i.call(e,n||e)}catch(s){f(s)}}}},v=function(t,r){var f=this,p=t.type,v=false,m,g,y=function(){var e=n().createObjectURL(t);h.push(e);return e},b=function(){d(f,"writestart progress write writeend".split(" "))},w=function(){if(v||!m){m=y(t)}if(g){g.location.href=m}else{window.open(m,"_blank")}f.readyState=f.DONE;b()},E=function(e){return function(){if(f.readyState!==f.DONE){return e.apply(this,arguments)}}},S={create:true,exclusive:false},x;f.readyState=f.INIT;if(!r){r="download"}if(s){m=y(t);i.href=m;i.download=r;o(i);f.readyState=f.DONE;b();return}if(e.chrome&&p&&p!==l){x=t.slice||t.webkitSlice;t=x.call(t,0,t.size,l);v=true}if(u&&r!=="download"){r+=".download"}if(p===l||u){g=e}if(!a){w();return}c+=t.size;a(e.TEMPORARY,c,E(function(e){e.root.getDirectory("saved",S,E(function(e){var n=function(){e.getFile(r,S,E(function(e){e.createWriter(E(function(n){n.onwriteend=function(t){g.location.href=e.toURL();h.push(e);f.readyState=f.DONE;d(f,"writeend",t)};n.onerror=function(){var e=n.error;if(e.code!==e.ABORT_ERR){w()}};"writestart progress write abort".split(" ").forEach(function(e){n["on"+e]=f["on"+e]});n.write(t);f.abort=function(){n.abort();f.readyState=f.DONE};f.readyState=f.WRITING}),w)}),w)};e.getFile(r,{create:false},E(function(e){e.remove();n()}),E(function(e){if(e.code===e.NOT_FOUND_ERR){n()}else{w()}}))}),w)}),w)},m=v.prototype,g=function(e,t){return new v(e,t)};m.abort=function(){var e=this;e.readyState=e.DONE;d(e,"abort")};m.readyState=m.INIT=0;m.WRITING=1;m.DONE=2;m.error=m.onwritestart=m.onprogress=m.onwrite=m.onabort=m.onerror=m.onwriteend=null;e.addEventListener("unload",p,false);return g}(self);


/***********************************************************************************************************************
 * Utility Functions
 **********************************************************************************************************************/
/**
 * Returns a deep copy of the passed object
 *   n.b. 1. clone() does not clone functions, however, since function definitions are immutable, the only possible
 *           issues are with expando properties and scope.  The former should not be done (seriously, WTH).  The latter
 *           is problematic either way (damned if you do, damned if you don't).
 *        2. clone() does not maintain referential relationships (e.g. multiple references to the same object will,
 *           post-cloning, refer to different equivalent objects; i.e. each reference will get its own clone of the
 *           original object).
 */
function clone(orig) {
	if (typeof orig !== "object" || orig == null) { // use lazy equality on null check
		return orig;
	}

	// honor native clone methods
	if (typeof orig.clone === "function") {
		return orig.clone(true);
	} else if (orig.nodeType && typeof orig.cloneNode === "function") {
		return orig.cloneNode(true);
	}

	// create a copy of the original
	var	type = Object.prototype.toString.call(orig),
		copy;
	if (type === "[object Date]") {
		copy = new Date(orig.getTime());
	} else if (type === "[object RegExp]") {
		copy = new RegExp(orig);
	} else if (Array.isArray(orig)) {
		copy = [];
	} else {
		// try to ensure that the returned object has the same prototype as the original
		var proto = Object.getPrototypeOf(orig);
		copy = proto ? Object.create(proto) : orig.constructor.prototype;
	}

	// duplicate the original's own properties; this also handles expando properties on non-generic objects
	Object.keys(orig).forEach(function (name) {
		// this does not preserve ES5 property attributes, however, neither does the delta coding and serialization
		// code, so it's not really an issue
		copy[name] = clone(orig[name]);
	});

	return copy;
}

/**
 * Returns the new DOM element, optionally appending it to the passed DOM element (if any)
 */
function insertElement(place, type, id, classNames, text, title) {
	var el = document.createElement(type);

	// add attributes
	if (id) {
		el.id = id;
	}
	if (classNames) {
		el.className = classNames;
	}
	if (title) {
		el.title = title;
	}

	// add content
	if (text) {
		insertText(el, text);
	}

	// append it to the given node
	if (place) {
		place.appendChild(el);
	}

	return el;
}

/**
 * Returns the new DOM element, after appending it to the passed DOM element
 */
function insertText(place, text) {
	return place.appendChild(document.createTextNode(text));
}

/**
 * Removes all children from the passed DOM node
 */
function removeChildren(node) {
	if (node) {
		while (node.hasChildNodes()) {
			node.removeChild(node.firstChild);
		}
	}
}

/**
 * Removes the passed DOM node
 */
function removeElement(node) {
	if (typeof node.remove === "function") {
		node.remove();
	} else if (node.parentNode) {
		node.parentNode.removeChild(node);
	}
}

/**
 * Wikifies a passage into a DOM element corresponding to the passed ID and returns the element
 */
function setPageElement(id, titles, defaultText) {
	var el = (typeof id === "object") ? id : document.getElementById(id);
	if (el == null) { // use lazy equality
		return null;
	}

	removeChildren(el);
	if (!Array.isArray(titles)) {
		titles = [ titles ];
	}
	for (var i = 0, iend = titles.length; i < iend; i++) {
		if (tale.has(titles[i])) {
			new Wikifier(el, tale.get(titles[i]).processText().trim());
			return el;
		}
	}
	if (defaultText != null) { // use lazy equality
		defaultText = defaultText.trim();
		if (defaultText !== "") {
			new Wikifier(el, defaultText);
		}
	}
	return el;
}

/**
 * Appends a new <style> element to the document's <head>
 */
function addStyle(css) {
	var style = document.getElementById("style-story");
	if (style === null) {
		style      = document.createElement("style");
		style.id   = "style-story";
		style.type = "text/css";
		document.head.appendChild(style);
	}

	// Check for wiki image transclusion.
	var	matchRe = /\[[<>]?[Ii][Mm][Gg]\[(?:\s|\S)*?\]\]+/g;
	if (matchRe.test(css)) {
		css = css.replace(matchRe, function (wikiImage) {
			var markup = Wikifier.helpers.parseSquareBracketedMarkup({
				source     : wikiImage,
				matchStart : 0
			});
			if (markup.hasOwnProperty("error") || markup.pos < wikiImage.length) {
				return wikiImage;
			}

			var source = markup.source;
			// Check for image passage transclusion.
			if (source.slice(0, 5) !== "data:" && tale.has(source)) {
				var passage = tale.get(source);
				if (passage.tags.contains("Twine.image")) {
					source = passage.text;
				}
			}
			// The source may be URI- or Base64-encoded, so we cannot use the
			// standard encodeURIComponent() here.  Instead, we simply encode
			// any double quotes, since the URI will be delimited by them.
			return 'url("' + source.replace(/"/g, "%22") + '")';
		});
	}

	if (style.styleSheet) {
		// for IE ≤ 10
		style.styleSheet.cssText += css;
	} else {
		// for everyone else
		style.appendChild(document.createTextNode(css));
	}
}

/**
 * Appends an error message to the passed DOM element
 */
function throwError(place, message, title) {
	insertElement(place, "span", null, "error", "Error: " + message, title);
	return false;
}

/**
	Returns the simple string representation of the passed value or, if there is none,
	the passed default value
 */
function printableStringOrDefault(val, defVal) {
	switch (typeof val) {
	case "number":
		if (isNaN(val)) {
			return defVal;
		}
		break;
	case "object":
		if (val === null) {
			return defVal;
		} else if (Array.isArray(val)) {
			return val.join(", ");
		}
		return "[object]";
	case "function":
	case "undefined":
		return defVal;
	}
	return String(val);
}

/**
 * Fades a DOM element in or out
 *   n.b. Unused, included only for compatibility
 */
function fade(el, options) {
	function tick() {
		current += 0.05 * direction;
		setOpacity(proxy, Math.easeInOut(current));
		if (((direction === 1) && (current >= 1)) || ((direction === -1) && (current <= 0))) {
			el.style.visibility = (options.fade === "in") ? "visible" : "hidden";
			proxy.parentNode.replaceChild(el, proxy);
			proxy = null;
			window.clearInterval(intervalId);
			if (options.onComplete) {
				options.onComplete();
			}
		}
	}
	function setOpacity(el, opacity) {
		var l = Math.floor(opacity * 100);

		// old IE
		el.style.zoom = 1;
		el.style.filter = "alpha(opacity=" + l + ")";

		// CSS
		el.style.opacity = opacity;
	}

	var	current,
		proxy      = el.cloneNode(true),
		direction  = (options.fade === "in") ? 1 : -1,
		intervalId;
	el.parentNode.replaceChild(proxy, el);
	if (options.fade === "in") {
		current = 0;
		proxy.style.visibility = "visible";
	} else {
		current = 1;
	}
	setOpacity(proxy, current);
	intervalId = window.setInterval(tick, 25);
}

/**
 * Scrolls the browser window to ensure that a DOM element is in view
 *   n.b. Unused, included only for compatibility
 */
function scrollWindowTo(el, increment) {
	function tick() {
		progress += increment;
		window.scroll(0, start + direction * (distance * Math.easeInOut(progress)));
		if (progress >= 1) {
			window.clearInterval(intervalId);
		}
	}
	function findPosY(el) {
		var curtop = 0;
		while (el.offsetParent) {
			curtop += el.offsetTop;
			el = el.offsetParent;
		}
		return curtop;
	}
	function ensureVisible(el) {
		var	posTop    = findPosY(el),
			posBottom = posTop + el.offsetHeight,
			winTop    = window.scrollY ? window.scrollY : document.body.scrollTop,
			winHeight = window.innerHeight ? window.innerHeight : document.body.clientHeight,
			winBottom = winTop + winHeight;
		if (posTop < winTop) {
			return posTop;
		} else {
			if (posBottom > winBottom) {
				if (el.offsetHeight < winHeight) {
					return (posTop - (winHeight - el.offsetHeight) + 20);
				} else {
					return posTop;
				}
			} else {
				return posTop;
			}
		}
	}

	// normalize increment
	if (increment == null) { // use lazy equality
		increment = 0.1;
	} else {
		if (typeof increment !== "number") {
			increment = Number(increment);
		}
		if (isNaN(increment) || increment < 0) {
			increment = 0.1;
		} else if (increment > 1) {
			increment = 1;
		}
	}

	var	start      = window.scrollY ? window.scrollY : document.body.scrollTop,
		end        = ensureVisible(el),
		distance   = Math.abs(start - end),
		progress   = 0,
		direction  = (start > end) ? -1 : 1,
		intervalId = window.setInterval(tick, 25);
}


/***********************************************************************************************************************
 * Util Object Static Methods
 **********************************************************************************************************************/
var Util = Object.defineProperties({}, {

	/**
	 * Returns whether the passed value is numeric
	 */
	isNumeric : {
		value : function (obj) {
			switch (typeof obj) {
			case "number":
				/* noop */
				break;
			case "string":
				obj = Number(obj);
				break;
			default:
				return false;
			}
			return isFinite(obj) && !isNaN(obj);
		}
	},

	/**
	 * Returns whether the passed value is boolean-ish
	 */
	isBoolean : {
		value : function (obj) {
			return typeof obj === "boolean" || (typeof obj === "string" && (obj === "true" || obj === "false"));
		}
	},

	/**
	 * Returns a lowercased and underscore encoded version of the passed string
	 */
	slugify : {
		value : function (str) {
			return str
				.trim()
				.replace(/[^\w\s\u2013\u2014-]+/g, '')
				.replace(/[_\s\u2013\u2014-]+/g, '-')
				.toLocaleLowerCase();
		}
	},

	/**
	 * Returns an entity encoded version of the passed string.
	 */
	escape : {
		value : function (str) {
			if (str == null) { // lazy equality for null
				return "";
			}
			var	htmlCharsRe    = /[&<>"'`]/g,
				hasHtmlCharsRe = RegExp(htmlCharsRe.source), // to drop the global flag
				htmlCharsMap   = {
					"&" : "&amp;",
					"<" : "&lt;",
					">" : "&gt;",
					'"' : "&quot;",
					"'" : "&#39;",
					"`" : "&#96;"
				};
			str = String(str);
			return str && hasHtmlCharsRe.test(str)
				? str.replace(htmlCharsRe, function (c) { return htmlCharsMap[c]; })
				: str;
		}
	},

	/**
	 * Returns a decoded version of the passed entity encoded string.
	 */
	unescape : {
		value : function (str) {
			if (str == null) { // lazy equality for null
				return "";
			}
			var	escapedHtmlRe    = /&(?:amp|lt|gt|quot|apos|#39|#x27|#96|#x60);/g,
				hasEscapedHtmlRe = RegExp(escapedHtmlRe.source), // to drop the global flag
				escapedHtmlMap   = {
					"&amp;"  : "&",
					"&lt;"   : "<",
					"&gt;"   : ">",
					"&quot;" : '"',
					"&apos;" : "'", // apostrophe from XML shenanigans
					"&#39;"  : "'", // apostrophe from decimal NCR
					"&#x27;" : "'", // apostrophe from hexadecimal NCR (fuck you, Underscorejs)
					"&#96;"  : "`", // backtick from decimal NCR
					"&#x60;" : "`"  // backtick from hexadecimal NCR (fuck you, Underscorejs)
				};
			str = String(str);
			return str && hasEscapedHtmlRe.test(str)
				? str.replace(escapedHtmlRe, function (c) { return escapedHtmlMap[c]; })
				: str;
		}
	},

	/**
	 * Returns the evaluation of the passed expression, throwing if there were errors
	 */
	evalExpression : {
		value : function (expression) {
			"use strict";
			// the parens are to protect object literals from being confused with block statements
			return eval("(" + expression + ")");
		}
	},

	/**
	 * Evaluates the passed statements, throwing if there were errors
	 */
	evalStatements : {
		value : function (statements) {
			"use strict";
			// the enclosing anonymous function is to isolate the passed code within its own scope
			eval("(function(){" + statements + "\n}());");
			return true;
		}
	},

	/**
	 * Diff operations enumeration
	 */
	DiffOp : {
		value : Object.freeze({
			Delete      : 0,
			SpliceArray : 1,
			Copy        : 2,
			CopyDate    : 3
		})
	},

	/**
	 * Returns a patch object containing the differences between the original and the destination objects
	 */
	diff : {
		value : function (orig, dest) /* diff object */ {
			"use strict";
			var	keys    = [].concat(Object.keys(orig), Object.keys(dest))
					        .sort().filter(function (v, i, a) { return (i === 0 || a[i-1] !== v); }),
				diff    = {},
				isArray = Array.isArray(orig),
				aOpRef;
			for (var i = 0, klen = keys.length; i < klen; i++) {
				var	p     = keys[i],
					origP = orig[p],
					destP = dest[p];
				if (orig.hasOwnProperty(p)) {
					if (dest.hasOwnProperty(p)) {
						// key exists in both
						if (origP === destP) {
							// values are exactly the same, so do nothing
							continue;
						}
						if (typeof origP === typeof destP) {
							// values are of the same basic type
							if (typeof origP === "function") {
								// values are functions
								/* diff[p] = [ Util.DiffOp.Copy, destP ]; */
								if (origP.toString() !== destP.toString()) {
									diff[p] = [ Util.DiffOp.Copy, destP ];
								}
							} else if (typeof origP !== "object" || origP === null) {
								// values are scalars or null
								diff[p] = [ Util.DiffOp.Copy, destP ];
							} else {
								// values are objects
								var	origPType = Object.prototype.toString.call(origP),
									destPType = Object.prototype.toString.call(destP);
								if (origPType === destPType) {
									// values are objects of the same prototype
									if (origPType === "[object Date]") {
										// special case: Date object
										if ((+origP) !== (+destP)) {
											diff[p] = [ Util.DiffOp.CopyDate, +destP ];
										}
									} else if (origPType === "[object RegExp]") {
										// special case: RegExp object
										if (origP.toString() !== destP.toString()) {
											diff[p] = [ Util.DiffOp.Copy, clone(destP) ];
										}
									} else {
										var recurse = Util.diff(origP, destP);
										if (recurse !== null) {
											diff[p] = recurse;
										}
									}
								} else {
									// values are objects of different prototypes
									diff[p] = [ Util.DiffOp.Copy, clone(destP) ];
								}
							}
						} else {
							// values are of different types
							diff[p] = [ Util.DiffOp.Copy, (typeof destP !== "object" || destP === null) ? destP : clone(destP) ];
						}
					} else {
						// key only exists in orig
						if (isArray && Util.isNumeric(p)) {
							var np = +p;
							if (!aOpRef) {
								aOpRef = "";
								do {
									aOpRef += "~";
								} while (keys.some(function (v) { return v === this.val; }, { val: aOpRef }));
								diff[aOpRef] = [ Util.DiffOp.SpliceArray, np, np ];
							}
							if (np < diff[aOpRef][1]) {
								diff[aOpRef][1] = np;
							}
							if (np > diff[aOpRef][2]) {
								diff[aOpRef][2] = np;
							}
						} else {
							diff[p] = Util.DiffOp.Delete;
						}
					}
				} else {
					// key only exists in dest
					diff[p] = [ Util.DiffOp.Copy, (typeof destP !== "object" || destP === null) ? destP : clone(destP) ];
				}
			}
			return (Object.keys(diff).length !== 0) ? diff : null;
		}
	},

	/**
	 * Returns an object resulting from updating the original object with the difference object
	 */
	patch : {
		value : function (orig, diff) /* patched object */ {
			"use strict";
			var	keys    = Object.keys(diff || {}),
				patched = clone(orig);
			for (var i = 0, klen = keys.length; i < klen; i++) {
				var	p     = keys[i],
					diffP = diff[p];
				if (diffP === Util.DiffOp.Delete) {
					delete patched[p];
				} else if (Array.isArray(diffP)) {
					switch (diffP[0]) {
					case Util.DiffOp.SpliceArray:
						patched.splice(diffP[1], 1 + (diffP[2] - diffP[1]));
						break;
					case Util.DiffOp.Copy:
						patched[p] = clone(diffP[1]);
						break;
					case Util.DiffOp.CopyDate:
						patched[p] = new Date(diffP[1]);
						break;
					}
				} else {
					patched[p] = Util.patch(patched[p], diffP);
				}
			}
			return patched;
		}
	},

	/**
	 * Returns the number of miliseconds represented by the passed CSS time string.
	 */
	fromCSSTime : {
		value : function (cssTime) {
			"use strict";
			var	re    = /^([+-]?[0-9]+(?:\.[0-9]+)?)\s*(m?s)$/, // more forgiving than the specification requires
				match = re.exec(cssTime);
			if (match === null) {
				throw new Error('invalid time value: "' + cssTime + '"');
			}
			if (match[2] === "ms") {
				return Number(match[1]);
			} else {
				return Number(match[1]) * 1000;
			}
		}
	},

	/**
	 * Returns the CSS time string represented by the passed number of milliseconds.
	 */
	toCSSTime : {
		value : function (msec) {
			"use strict";
			if (typeof msec !== "number" || isNaN(msec) || !isFinite(msec)) {
				var what;
				switch (typeof msec) {
				case "string":
					what = '"' + msec + '"';
					break;
				case "number":
					what = String(msec);
					break;
				default:
					what = Object.prototype.toString.call(msec);
					break;
				}
				throw new Error("invalid milliseconds: " + what);
			}
			return msec + "ms";
		}
	},

	/**
	 * Returns an object containing the component properties parsed from the passed URL.
	 */
	parseUrl : {
		value : function (url) {
			var
				el       = document.createElement('a'),
				queryObj = Object.create(null);

			// Let the `<a>` element parse the URL.
			el.href = url;

			// Populate the `queryObj` object with the query string attributes.
			el.search.replace(/^\?/, '').split(/(?:&(?:amp;)?|;)/).forEach(function (query) {
				var kvPair = query.split('=');
				queryObj[kvPair[0]] = kvPair[1];
			});

			/*
				Caveats by browser:
					Edge and Internet Explorer (≥8) do not support authentication information
					within a URL at all and will throw a security exception on *any* property
					access if its included.

					Internet Explorer does not include the leading forward slash on `pathname`
					when required.

					Opera (Presto) strips the authentication information from `href` and does
					not supply `username` or `password`.

					Safari (circa. 5.1.x) does not supply `username` or `password` and peforms
					URI decoding on `pathname`.
			*/

			// Patch for IE not including the leading slash on `pathname` when required.
			var pathname = el.host && el.pathname[0] !== '/' ? '/' + el.pathname : el.pathname;

			return {
				// The full URL that was originally parsed.
				href : el.href,

				// The request protocol, lowercased.
				protocol : el.protocol,

				// // The full authentication information.
				// auth : el.username || el.password
				// 	? el.username + ':' + el.password`
				// 	: typeof el.username === 'string' ? '' : undefined,
				//
				// // The username portion of the auth info.
				// username : el.username,
				//
				// // The password portion of the auth info.
				// password : el.password,

				// The full host information, including port number, lowercased.
				host : el.host,

				// The hostname portion of the host info, lowercased.
				hostname : el.hostname,

				// The port number portion of the host info.
				port : el.port,

				// The full path information, including query info.
				path : pathname + el.search,

				// The pathname portion of the path info.
				pathname : pathname,

				// The query string portion of the path info, including the leading question mark.
				query  : el.search,
				search : el.search,

				// The attributes portion of the query string, parsed into an object.
				queries  : queryObj,
				searches : queryObj,

				// The fragment string, including the leading hash/pound sign.
				hash : el.hash
			};
		}
	}

});

// Setup aliases
Object.defineProperties(Util, {

	/*
		[DEPRECATED] Backup Math.random, in case it's replaced later.
	*/
	random : {
		value : Math.random
	},

	/*
		[DEPRECATED] Alias of `Util.escape`.
	*/
	entityEncode : {
		value : Util.escape
	},

	/*
		[DEPRECATED] Alias of `Util.unescape`.
	*/
	entityDecode : {
		value : Util.unescape
	}

});


/***********************************************************************************************************************
 * Seedable PRNG (wrapper for seedrandom.js)
 **********************************************************************************************************************/
// Setup the SeedablePRNG constructor
function SeedablePRNG(seed, useEntropy) {
	Object.defineProperties(this, new Math.seedrandom(seed, useEntropy, function (prng, seed) {
		return {
			_prng : {
				value : prng
			},
			seed : {
				writable : true,
				value    : seed
			},
			count : {
				writable : true,
				value    : 0
			},
			random : {
				value : function () {
					this.count++;
					return this._prng();
				}
			}
		};
	}));
}

// Setup the SeedablePRNG static methods
Object.defineProperties(SeedablePRNG, {
	marshal : {
		value : function (prng) {
			if (!prng || !prng.hasOwnProperty("seed") || !prng.hasOwnProperty("count")) {
				throw new Error("PRNG is missing required data");
			}

			return {
				seed  : prng.seed,
				count : prng.count
			};
		}
	},

	unmarshal : {
		value : function (prngObj) {
			if (!prngObj || !prngObj.hasOwnProperty("seed") || !prngObj.hasOwnProperty("count")) {
				throw new Error("PRNG object is missing required data");
			}

			// create a new PRNG using the original seed
			var prng = new SeedablePRNG(prngObj.seed, false);

			// pull values until the new PRNG is in sync with the original
			for (var i = 0, iend = prngObj.count; i < iend; i++) {
				prng.random();
			}
			return prng;
		}
	}
});


/*******************************************************************************************************************
 * AudioWrapper
 ******************************************************************************************************************/
// Setup the AudioWrapper constructor
function AudioWrapper(audio) {
	Object.defineProperties(this, {
		audio : {
			value : audio
		},
		_faderId : {
			writable : true,
			value    : null
		}
	});
	if (this.audio.preload !== "metadata" && this.audio.preload !== "auto") {
		this.audio.preload = "metadata";
	}
}

/*
	Setup the AudioWrapper prototype

	n.b. The various data constants (e.g. for comparison to `readyState` or `networkState`)
	     are not defined by all browsers on the descendant elements `HTMLAudioElement` and
	     `HTMLVideoElement` (notably, IE/Edge do not).  Therefore, the base media element,
	     `HTMLMediaElement`, must be used to reference the constants.
*/
Object.defineProperties(AudioWrapper.prototype, {
	/*
		Getters/Setters
	*/
	duration : {
		get : function () {
			return this.audio.duration;
		}
	},
	time : {
		get : function () {
			return this.audio.currentTime;
		},
		set : function (time) {
			/*
				If we try to modify the audio clip's `.currentTime` property before its metadata
				has been loaded, it will throw an `InvalidStateError` (since it doesn't know its
				duration, allowing `.currentTime` to be set would be undefined behavior), so we
				must check its readiness first.
			*/
			if (this.hasMetadata()) {
				this.audio.currentTime = time;
			} else {
				jQuery(this.audio)
					.off("loadedmetadata.AudioWrapper:time")
					.one("loadedmetadata.AudioWrapper:time", function () {
						this.currentTime = time;
					});
			}
		}
	},
	volume : {
		get : function () {
			return this.audio.volume;
		},
		set : function (vol) {
			this.audio.volume = Math.clamp(vol, 0, 1);
		}
	},
	controls : {
		get : function () {
			return this.audio.controls;
		},
		set : function (state) {
			this.audio.controls = !!state;
		}
	},

	/*
		Methods
	*/
	hasMetadata : {
		value : function () {
			return this.audio.readyState >= HTMLMediaElement.HAVE_METADATA;
		}
	},
	hasData : {
		value : function () {
			return this.audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
		}
	},
	noSource : {
		value : function () {
			return this.audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;
		}
	},
	isPlaying : {
		value : function () {
			return !(this.audio.ended || this.audio.paused || !this.hasData());
		}
	},
	isEnded : {
		value : function () {
			return this.audio.ended;
		}
	},
	isPaused : {
		value : function () {
			return this.audio.paused;
		}
	},
	isMuted : {
		value : function () {
			return this.audio.muted;
		}
	},
	isLooped : {
		value : function () {
			return this.audio.loop;
		}
	},

	load : {
		value : function () {
			if (this.audio.preload !== "auto") {
				this.audio.preload = "auto";
			}
			this.audio.load();
		}
	},
	play : {
		value : function () {
			if (!this.hasData()) {
				this.load();
			}
			this.audio.play();
		}
	},
	pause : {
		value : function () {
			this.audio.pause();
		}
	},
	stop : {
		value : function () {
			this.audio.pause();
			this.time = 0;
		}
	},

	mute : {
		value : function () {
			this.audio.muted = true;
		}
	},
	unmute : {
		value : function () {
			this.audio.muted = false;
		}
	},
	loop : {
		value : function () {
			this.audio.loop = true;
		}
	},
	unloop : {
		value : function () {
			this.audio.loop = false;
		}
	},

	fadeWithDuration : {
		value : function (duration, from, to) {
			if (this._faderId !== null) {
				clearInterval(this._faderId);
				this._faderId = null;
			}
			from = Math.clamp(from, 0, 1);
			to   = Math.clamp(to, 0, 1);
			if (from === to) {
				return;
			}
			this.volume = from;

			/*
				We listen for the `timeupdate` event here, rather than `playing`, because
				various browsers (notably, mobile browsers) are poor at firing media events
				in a timely fashion, so we use `timeupdate` to ensure that we don't start
				the fade until the track is actually progressing.
			*/
			jQuery(this.audio)
				.off("timeupdate.AudioWrapper:fadeWithDuration")
				.one("timeupdate.AudioWrapper:fadeWithDuration", (function (self) {
					return function () {
						var min, max;
						if (from < to) {
							// Fade in.
							min = from;
							max = to;
						} else {
							// Fade out.
							min = to;
							max = from;
						}
						duration = Math.clamp(duration, 1, self.duration || 5);
						var	interval = 25, // in milliseconds
							delta    = (to - from) / (duration / (interval / 1000));
						self._faderId = setInterval(function () {
							if (!self.isPlaying()) {
								clearInterval(self._faderId);
								self._faderId = null;
								return;
							}
							self.volume = Math.clamp(self.volume + delta, min, max);
							if (self.volume === 0) {
								self.pause();
							}
							if (self.volume === to) {
								clearInterval(self._faderId);
								self._faderId = null;
							}
						}, interval);
					};
				})(this));

			this.play();
		}
	},
	fade : {
		value : function (from, to) {
			this.fadeWithDuration(5, from, to);
		}
	},
	fadeIn : {
		value : function () {
			this.fade(this.volume, 1);
		}
	},
	fadeOut : {
		value : function () {
			this.fade(this.volume, 0);
		}
	},

	onPlay : {
		value : function (callback) {
			if (typeof callback === "function") {
				jQuery(this.audio).on("playing.AudioWrapper:onPlay", callback);
			} else {
				jQuery(this.audio).off("playing.AudioWrapper:onPlay");
			}
		}
	},
	onePlay : {
		value : function (callback) {
			if (typeof callback === "function") {
				jQuery(this.audio).one("playing.AudioWrapper:onePlay", callback);
			} else {
				jQuery(this.audio).off("playing.AudioWrapper:onePlay");
			}
		}
	},

	onPause : {
		value : function (callback) {
			if (typeof callback === "function") {
				jQuery(this.audio).on("pause.AudioWrapper:onPause", callback);
			} else {
				jQuery(this.audio).off("pause.AudioWrapper:onPause");
			}
		}
	},
	onePause : {
		value : function (callback) {
			if (typeof callback === "function") {
				jQuery(this.audio).one("pause.AudioWrapper:onePause", callback);
			} else {
				jQuery(this.audio).off("pause.AudioWrapper:onePause");
			}
		}
	},

	onEnd : {
		value : function (callback) {
			if (typeof callback === "function") {
				jQuery(this.audio).on("ended.AudioWrapper:onEnd", callback);
			} else {
				jQuery(this.audio).off("ended.AudioWrapper:onEnd");
			}
		}
	},
	oneEnd : {
		value : function (callback) {
			if (typeof callback === "function") {
				jQuery(this.audio).one("ended.AudioWrapper:oneEnd", callback);
			} else {
				jQuery(this.audio).off("ended.AudioWrapper:oneEnd");
			}
		}
	},

	clone : {
		value : function () {
			return new AudioWrapper(this.audio.cloneNode(true));
		}
	}
});
