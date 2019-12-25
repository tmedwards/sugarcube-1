/***********************************************************************************************************************
 *
 * main.js
 *
 * Copyright © 2013–2015 Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
 * Use of this source code is governed by a Simplified BSD License which can be found in the LICENSE file.
 *
 **********************************************************************************************************************/

/***********************************************************************************************************************
 * Error Handling Setup
 **********************************************************************************************************************/
function alertUser(type, where, mesg, error) {
	var	errMesg = "Apologies! A " + type + " problem has occurred.";
	switch (type) {
	case "fatal":
		errMesg += " Aborting.";
		break
	case "technical":
		errMesg += " You may be able to continue, but some parts may not work properly.";
		break
	}
	if (where != null || mesg != null) { // use lazy equality
		errMesg += "\n\nError";
		if (where != null) { // use lazy equality
			errMesg += " [" + where + "]";
		}
		errMesg += ": " + ((mesg != null) ? mesg.replace(/^Error:\s+/, "") : "unknown error") + "."; // use lazy equality on null check
	}
	if (error && error.stack) {
		errMesg += "\n\nStack Trace:\n" + error.stack;
	}
	window.alert(errMesg);
}

function fatalAlert(where, mesg, error) {
	alertUser("fatal", where, mesg, error);
}

function technicalAlert(where, mesg, error) {
	alertUser("technical", where, mesg, error);
}

if (!DEBUG) {
	window.onerror = function (mesg, url, lineNum, colNum, error) {
		technicalAlert(null, mesg, error);
	};
}


/***********************************************************************************************************************
 * Initialization
 **********************************************************************************************************************/
window.SugarCube = {}; // will contain exported identifiers, also allows scripts to detect if they're running in SugarCube (e.g. "SugarCube" in window)

var	version = Object.freeze({
		// data properties
		title      : "SugarCube",
		major      : "{{BUILD_VERSION_MAJOR}}",
		minor      : "{{BUILD_VERSION_MINOR}}",
		patch      : "{{BUILD_VERSION_PATCH}}",
		prerelease : "{{BUILD_VERSION_PRERELEASE}}",
		build      : "{{BUILD_VERSION_BUILD}}",
		date       : new Date("{{BUILD_VERSION_DATE}}"),
		/* legacy */
		extensions : {},
		/* /legacy */

		// method properties
		toString : function () {
			return this.major + "." + this.minor + "." + this.patch
				+ (this.prerelease ? "-" + this.prerelease : "") + "+" + this.build;
		},
		short : function () {
			return this.title + " (v" + this.major + "." + this.minor + "." + this.patch
				+ (this.prerelease ? "-" + this.prerelease : "") + ")";
		},
		long : function () {
			return this.title + " v" + this.toString() + " (" + this.date.toUTCString() + ")";
		}
	});

/* deprecated */
// History modes enumeration
var	HistoryMode = Object.freeze({ Hash : History.Modes.Hash, Window : History.Modes.Window, Session : History.Modes.Session }),
	modes = Object.freeze({ hashTag : History.Modes.Hash, windowHistory : History.Modes.Window, sessionHistory : History.Modes.Session });
/* /deprecated */

// Runtime object (internal use only)
var	runtime = Object.defineProperties({}, {
		flags : {
			value : {
				HistoryPRNG : {
					isEnabled  : false,
					isMathPRNG : false
				}
			}
		},
		temp : {
			writable : true,
			value    : {}
		}
	});

// Config object (author/developer use)
var	config = {
		/* deprecated */
		// capability properties
		hasPushState      : has.pushState,
		hasLocalStorage   : has.localStorage,
		hasSessionStorage : has.sessionStorage,
		hasFileAPI        : has.fileAPI,
		/* /deprecated */

		/* deprecated */
		// basic browser detection
		userAgent : browser.userAgent,
		browser   : browser,
		/* /deprecated */

		// general option properties
		addVisitedLinkClass   : false,
		altPassageDescription : undefined,
		displayPassageTitles  : false,
		loadDelay             : 0,
		startPassage          : undefined,
		updatePageElements    : true,

		// history option properties
		disableHistoryControls : false,
		disableHistoryTracking : false,
		historyMode            : (has.pushState ? (has.sessionStorage ? History.Modes.Session : History.Modes.Window) : History.Modes.Hash),

		// transition properties
		passageTransitionOut   : undefined,
		transitionEndEventName : (function () {
			var	teMap  = {
					"transition"       : "transitionend",
					"MSTransition"     : "msTransitionEnd",
					"WebkitTransition" : "webkitTransitionEnd",
					"MozTransition"    : "transitionend"
				},
				teKeys = Object.keys(teMap),
				el     = document.createElement("div");
			for (var i = 0; i < teKeys.length; i++) {
				if (el.style[teKeys[i]] !== undefined) {
					return teMap[teKeys[i]];
				}
			}
			return "";
		}()),

		// macros option properties
		macros : {
			disableIfAssignmentError : false,
			maxLoopIterations        : 1000
		},

		// saves option properties
		saves : {
			autoload  : undefined,
			autosave  : undefined,
			id        : "untitled-story",
			isAllowed : undefined,
			onLoad    : undefined,
			onSave    : undefined,
			slots     : 8
		},

		/* DEPRECATED; see strings.js */
		// error messages properties
		errorName : undefined,
		errors    : { /* noop */ }
		/* /DEPRECATED */
	};

var	macros      = {}, // macros manager
	tale        = {}, // story manager
	state       = {}, // history manager
	storage     = {}, // persistant storage manager
	session     = {}, // session storage manager
	options     = {}, // options variable store
	setup       = {}, // author setup variable store
	prehistory  = {}, // pre-history task callbacks
	predisplay  = {}, // pre-display task callbacks
	postdisplay = {}, // post-display task callbacks
	prerender   = {}, // Twine 1.4+ pre-render task callbacks
	postrender  = {}; // Twine 1.4+ post-render task callbacks

/**
 * Main function, entry point for story startup
 */
jQuery(document).ready(function () {
	if (DEBUG) { console.log("[main()]"); }

	/**
	 * WARNING!
	 *
	 * The ordering of the code in this function is important, so be careful when mucking around with it.
	 */
	try {

		// normalize the document
		if (document.normalize) {
			document.normalize();
		}

		// instantiate the macro object and standard macro library (this must be done before any passages are processed)
		macros = new Macros();
		defineStandardMacros();

		// instantiate the tale, state, storage, and session objects
		tale = new Tale();
		tale.init();
		state   = new History();
		storage = new KeyValueStore("webStorage", true, tale.domId); // params: driverType, persist, storageId
		session = new KeyValueStore("webStorage", false, tale.domId);

		// set the default saves ID
		config.saves.id = tale.domId;

		// initialize the user interface (this must be done before script passages)
		UISystem.init();

		// alert players when their browser is degrading basic required capabilities
		if (!session.hasItem("rcWarn") && (!has.pushState || storage.name === "cookie")) {
			session.setItem("rcWarn", 1);
			window.alert((
				  'Apologies! Your browser either lacks some of the capabilities required by this %identity% or has '
				+ 'disabled them, so this %identity% is running in a degraded mode. You may be able to continue, but '
				+ 'some parts may not work properly.\n\nThe former may, probably, be solved by upgrading your browser. '
				+ 'The latter may be solved by loosening its security restrictions'
				+ (window.location.protocol === "file:" ? " or, perhaps, by playing this %identity% via the HTTP protocol." : ".")
			).replace(/%identity%/g, strings.identity));
		}

		// add the story styles
		for (var i = 0; i < tale.styles.length; i++) {
			addStyle(tale.styles[i].text);
		}

		// evaluate the story scripts
		for (var i = 0; i < tale.scripts.length; i++) {
			try {
				eval(tale.scripts[i].text);
			} catch (e) {
				technicalAlert(tale.scripts[i].title, e.message);
			}
		}

		// process the story widgets
		for (var i = 0; i < tale.widgets.length; i++) {
			try {
				Wikifier.wikifyEval(tale.widgets[i].processText());
			} catch (e) {
				technicalAlert(tale.widgets[i].title, e.message);
			}
		}

		// initialize the save system (this must be done after script passages and before state initialization)
		SaveSystem.init();

		// call macros' "early" init functions
		macros.init();

		// initialize our state
		state.init(); // this could take a while, so do it late

		// call macros' "late" init functions
		macros.lateInit();

		// start the user interface
		UISystem.start();

	} catch (e) {
		return fatalAlert(null, e.message);
	}

	// lastly, export identifiers for debugging purposes
	window.SugarCube = {
		version    : version,
		runtime    : runtime,
		has        : has,
		browser    : browser,
		config     : config,
		setup      : setup,
		storage    : storage,
		session    : session,
		macros     : macros,
		tale       : tale,
		state      : state,
		Wikifier   : Wikifier,
		Util       : Util,
		History    : History,
		Passage    : Passage,
		Tale       : Tale,
		SaveSystem : SaveSystem,
		UISystem   : UISystem
	};
});

