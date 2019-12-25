/***********************************************************************************************************************
 *
 * keyvaluestore.js
 *
 * Copyright © 2013–2015 Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
 * Use of this source code is governed by a Simplified BSD License which can be found in the LICENSE file.
 *
 **********************************************************************************************************************/

var KeyValueStore = (function () {
	"use strict";

	/*******************************************************************************************************************
	 * KeyValueStore Constructor
	 ******************************************************************************************************************/
	function KeyValueStore(driverType, persist, storageId) {
		var driver = null;
		switch (driverType) {
		case "cookie":
			driver = new KeyValueStore_Cookie(persist, storageId);
			break;
		case "webStorage":
			driver = new KeyValueStore_WebStorage(persist, storageId);
			if (!driver._ok) {
				// fallback to cookies
				driver = new KeyValueStore_Cookie(persist, storageId);
			}
			break;
		default:
			throw new Error("unknown driver type");
			break;
		}
		if (!driver._ok) {
			throw new Error("unknown driver error");
		}
		Object.defineProperties(this, {
			_driver : {
				value : driver
			},
			name : {
				value : driver.name
			},
			type : {
				value : driverType
			},
			id : {
				value : storageId
			},
			persist : {
				value : persist
			}
		});
	}

	/*******************************************************************************************************************
	 * KeyValueStore Prototype Methods
	 ******************************************************************************************************************/
	Object.defineProperties(KeyValueStore.prototype, {
		length : {
			get : function () {
				if (this._driver === null) {
					return 0;
				}
				if (DEBUG) { console.log('[<KeyValueStore>.length]'); }

				return this._driver.length;
			}
		},

		keys : {
			value : function () {
				if (this._driver === null) {
					return [];
				}
				if (DEBUG) { console.log('[<KeyValueStore>.keys()]'); }

				return this._driver.keys();
			}
		},

		clear : {
			value : function () {
				if (this._driver === null) {
					return false;
				}
				if (DEBUG) { console.log('[<KeyValueStore>.clear()]'); }

				var keys = this.keys();
				for (var i = 0; i < keys.length; i++) {
					if (DEBUG) { console.log("    > removing key: " + keys[i]); }
					this.removeItem(keys[i]);
				}
				return true;
			}
		},

		hasItem : {
			value : function (key) {
				if (this._driver === null || !key) {
					return false;
				}
				if (DEBUG) { console.log('[<KeyValueStore>.hasItem("' + key + '")]'); }

				return this._driver.has(key);
			}
		},

		getItem : {
			value : function (key) {
				if (this._driver === null || !key) {
					return null;
				}
				if (DEBUG) { console.log('[<KeyValueStore>.getItem("' + key + '")]'); }

				var value = this._driver.retrieve(key);
				if (value == null) { // use lazy equality
					return null;
				}

				/* legacy */
				var legacy = false;
				if (value.slice(0, 2) === "#~") {
					// try it as a flagged, compressed value
					value = this._driver.deserialize(value.slice(2));
					legacy = true;
				} else {
					try {
				/* /legacy */
						// try it as an unflagged, compressed value
						value = this._driver.deserialize(value);
				/* legacy */
					} catch (e) {
						// finally, try it as an uncompressed value
						value = JSON.parse(value);
						legacy = true;
					}
				}
				// attempt to upgrade the legacy value
				if (legacy && !this.setItem(key, value, true)) {
					throw new Error('unable to upgrade legacy value for key "' + key + '" to new format');
				}
				/* /legacy */

				return value;
			}
		},

		setItem : {
			value : function (key, value, quiet) {
				if (this._driver === null || !key) {
					return false;
				}
				if (DEBUG) { console.log('[<KeyValueStore>.setItem("' + key + '")]'); }

				return this._driver.store(key, this._driver.serialize(value), quiet);
			}
		},

		removeItem : {
			value : function (key) {
				if (this._driver === null || !key) {
					return false;
				}
				if (DEBUG) { console.log('[<KeyValueStore>.removeItem("' + key + '")]'); }

				return this._driver.remove(key);
			}
		},

		removeMatchingItems : {
			value : function (subKey) {
				if (this._driver === null || !subKey) {
					return false;
				}
				if (DEBUG) { console.log('[<KeyValueStore>.removeMatchingItems("' + subKey + '")]'); }

				var	keys = this.keys(),
					re   = new RegExp("^" + RegExp.escape(subKey));
				for (var i = 0; i < keys.length; i++) {
					if (re.test(keys[i])) {
						if (DEBUG) { console.log("    > removing key: " + keys[i]); }
						this.removeItem(keys[i]);
					}
				}
				return true;
			}
		}
	});


	/*
	 * STORAGE DRIVER: WebStorage
	 */
	/*******************************************************************************************************************
	 * KeyValueStore_WebStorage Constructor
	 ******************************************************************************************************************/
	function KeyValueStore_WebStorage(persist, storageId) {
		var	engine = null,
			name   = null;
		if (persist) {
			if (has.localStorage) {
				engine = window.localStorage;
				name   = "localStorage";
			}
		} else {
			if (has.sessionStorage) {
				engine = window.sessionStorage;
				name   = "sessionStorage";
			}
		}
		Object.defineProperties(this, {
			_ok : {
				value : engine !== null
			},
			_engine : {
				value : engine
			},
			_prefix : {
				value : storageId + "."
			},
			_prefixRe : {
				value : new RegExp("^" + RegExp.escape(storageId + "."))
			},
			name : {
				value : name
			},
			id : {
				value : storageId
			},
			persist : {
				value : persist
			}
		});
	}

	/*******************************************************************************************************************
	 * KeyValueStore_WebStorage Prototype Methods
	 ******************************************************************************************************************/
	Object.defineProperties(KeyValueStore_WebStorage.prototype, {
		serialize : {
			value : function (obj) {
				return LZString.compressToUTF16(JSON.stringify(obj));
			}
		},

		deserialize : {
			value : function (str) {
				return JSON.parse(LZString.decompressFromUTF16(str));
			}
		},

		length : {
			get : function () {
				/*
				 * DO NOT do something like: return this._engine.length;
				 * That will return the length of the entire store, rather than just our prefixed keys.
				 */
				return this.keys().length;
			}
		},

		keys : {
			value : function () {
				if (this._engine === null) {
					return [];
				}

				var keys = [];
				for (var i = 0; i < this._engine.length; i++) {
					var key = this._engine.key(i);
					if (this._prefixRe.test(key)) {
						keys.push(key.replace(this._prefixRe, ""));
					}
				}
				return keys;
			}
		},

		has : {
			value : function (key) {
				if (this._engine === null || !key) {
					return false;
				}

				// we really should be checking keys here
				return this._engine.getItem(this._prefix + key) != null; // use lazy equality
			}
		},

		retrieve : {
			value : function (key) {
				if (this._engine === null || !key) {
					return null;
				}
				return this._engine.getItem(this._prefix + key);
			}
		},

		store : {
			value : function (key, value, quiet) {
				if (this._engine === null || !key) {
					return false;
				}

				try {
					this._engine.setItem(this._prefix + key, value);
				} catch (e) {
					/*
					 * Ideally, we could simply do something like:
					 *     e.code === 22
					 * Or, preferably, something like this:
					 *     e.code === DOMException.QUOTA_EXCEEDED_ERR
					 * However, both of those are browser convention, not part of the standard,
					 * and are not supported in all browsers.  So, we have to resort to pattern
					 * matching the damn name.  I hate the parties responsible for this snafu
					 * so much.
					 */
					if (!quiet) {
						technicalAlert(null, 'unable to store key "' + key + '"; '
							+ (/quota_?(?:exceeded|reached)/i.test(e.name) ? this.name + " quota exceeded" : "unknown error")
							, e);
					}
					return false;
				}
				return true;
			}
		},

		remove : {
			value : function (key) {
				if (this._engine === null || !key) {
					return false;
				}

				this._engine.removeItem(this._prefix + key);
				return true;
			}
		}
	});


	/*
	 * STORAGE DRIVER: Cookie
	 */
	/*******************************************************************************************************************
	 * KeyValueStore_Cookie Constructor
	 ******************************************************************************************************************/
	function KeyValueStore_Cookie(persist, storageId) {
		Object.defineProperties(this, {
			_ok : {
				value : "cookie" in document // should really try to test cookie functionality
			},
			_prefix : {
				value : storageId + "."
			},
			_prefixRe : {
				value : new RegExp("^" + RegExp.escape(storageId + "."))
			},
			name : {
				value : "cookie"
			},
			id : {
				value : storageId
			},
			persist : {
				value : persist
			}
		});
	}

	/*******************************************************************************************************************
	 * KeyValueStore_Cookie Prototype Methods
	 ******************************************************************************************************************/
	Object.defineProperties(KeyValueStore_Cookie.prototype, {
		_setCookie : {
			value : function (key, value, expiry) {
				if ("cookie" in document) {
					var payload = encodeURIComponent(this._prefix + key) + "=";
					if (value != null) { // use lazy equality
						payload += encodeURIComponent(value);
					}
					if (expiry != null) { // use lazy equality
						payload += "; " + expiry;
					}
					payload += "; path=/";
					document.cookie = payload;
				}
			}
		},

		_getCookies : {
			value : function () {
				var cookieObj = {};
				if ("cookie" in document && document.cookie !== "") {
					var cookies = document.cookie.split(/;\s*/);
					for (var i = 0; i < cookies.length; i++) {
						var	kv  = cookies[i].split("="),
							key = decodeURIComponent(kv[0]);
						if (this._prefixRe.test(key)) {
							cookieObj[key] = decodeURIComponent(kv[1]);
						}
					}
				}
				return cookieObj;
			}
		},

		serialize : {
			value : function (obj) {
				return LZString.compressToBase64(JSON.stringify(obj));
			}
		},

		deserialize : {
			value : function (str) {
				return JSON.parse(LZString.decompressFromBase64(str));
			}
		},

		length : {
			get : function () {
				return this.keys().length;
			}
		},

		keys : {
			value : function () {
				return Object.keys(this._getCookies());
			}
		},

		has : {
			value : function (key) {
				if (!key) {
					return false;
				}

				return this._getCookies().hasOwnProperty(this._prefix + key);
			}
		},

		retrieve : {
			value : function (key) {
				if (!key) {
					return null;
				}

				var	cookies = this._getCookies(),
					pKey    = this._prefix + key;
				if (cookies.hasOwnProperty(pKey)) {
					return cookies[pKey];
				}
				return null;
			}
		},

		store : {
			value : function (key, value, quiet) {
				if (!key) {
					return false;
				}

				try {
					this._setCookie(key, value, this.persist ? "Tue, 19 Jan 2038 03:14:07 GMT" : undefined); // undefined expiry means a session cookie
				} catch (e) {
					if (!quiet) {
						technicalAlert(null, 'unable to store key "' + key + '"; cookie error: ' + e.message, e);
					}
					return false;
				}
				if (!this.has(key)) {
					if (!quiet) {
						technicalAlert(null, 'unable to store key "' + key + '"; unknown cookie error');
					}
					return false;
				}
				return true;
			}
		},

		remove : {
			value : function (key, quiet) {
				if (!key) {
					return false;
				}

				try {
					this._setCookie(key, undefined, "Thu, 01 Jan 1970 00:00:00 GMT");
				} catch (e) {
					if (!quiet) {
						technicalAlert(null, 'unable to remove key "' + key + '"; cookie error: ' + e.message, e);
					}
					return false;
				}
				if (this.has(key)) {
					if (!quiet) {
						technicalAlert(null, 'unable to remove key "' + key + '"; unknown cookie error');
					}
					return false;
				}
				return true;
			}
		}
	});


	/*******************************************************************************************************************
	 * Exports
	 ******************************************************************************************************************/
	return KeyValueStore; // export the constructor

}());

