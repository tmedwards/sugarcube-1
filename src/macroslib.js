/***********************************************************************************************************************
 *
 * macroslib.js
 *
 * Copyright © 2013–2016 Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
 * Use of this source code is governed by a Simplified BSD License which can be found in the LICENSE file.
 *
 **********************************************************************************************************************/

/***********************************************************************************************************************
 * Standard Macro Definitions
 **********************************************************************************************************************/
function defineStandardMacros() {

	/*******************************************************************************************************************
	 * Utility Functions
	 ******************************************************************************************************************/
	function setupWikifyEvalEvent($targets, eventName, options) {
		options = jQuery.extend({}, options);
		$targets.addClass("event-" + Util.slugify(eventName) + (options.once ? "-once" : ""));
		$targets[options.once ? "one" : "on"](eventName + ".macros", function () {
			if (options.content !== "") {
				var argsCache;
				// there's no catch clause because this try/finally is here simply to ensure that
				// the $args variable is properly restored in the event that an exception is thrown
				// during the Wikifier.wikifyEval() call
				try {
					if (typeof options.widgetArgs !== "undefined") {
						// cache the existing $args variable, if any
						if (state.active.variables.hasOwnProperty("args")) {
							argsCache = state.active.variables.args;
						}

						// setup the $args variable
						state.active.variables.args = options.widgetArgs;
					}

					// wikify the content and discard any output, unless there were errors
					Wikifier.wikifyEval(options.content);
				} finally {
					if (typeof options.widgetArgs !== "undefined") {
						// teardown the $args variable
						delete state.active.variables.args;

						// restore the cached $args variable, if any
						if (typeof argsCache !== "undefined") {
							state.active.variables.args = argsCache;
						}
					}
				}
			}

			// call the given callback function, if any
			if (typeof options.callback === "function") {
				options.callback();
			}
		});
	}


	/*******************************************************************************************************************
	 * Links
	 ******************************************************************************************************************/
	/**
	 * <<actions>>
	 */
	macros.add("actions", {
		version : { major : 3, minor : 0, patch : 0 },
		handler : function () {
			var list = insertElement(this.output, "ul");
			list.classList.add(this.name);
			if (!state.active.variables["#actions"]) {
				state.active.variables["#actions"] = {};
			}
			for (var i = 0; i < this.args.length; i++) {
				var	passage,
					text,
					image,
					setFn,
					el;

				if (typeof this.args[i] === "object" && this.args[i].isImage) {
					// argument was in wiki image syntax
					image = document.createElement("img");
					image.src = this.args[i].source;
					if (this.args[i].hasOwnProperty("passage")) {
						image.setAttribute("data-passage", this.args[i].passage);
					}
					if (this.args[i].hasOwnProperty("title")) {
						image.title = this.args[i].title;
					}
					if (this.args[i].hasOwnProperty("align")) {
						image.align = this.args[i].align;
					}
					passage = this.args[i].link;
					setFn   = this.args[i].setFn;
				} else {
					if (typeof this.args[i] === "object") {
						// argument was in wiki link syntax
						text    = this.args[i].text;
						passage = this.args[i].link;
						setFn   = this.args[i].setFn;
					} else {
						// argument was simply the passage name
						text = passage = this.args[i];
					}
				}

				if (
					   state.active.variables["#actions"].hasOwnProperty(passage)
					&& state.active.variables["#actions"][passage]
				) {
					continue;
				}

				el = Wikifier.createInternalLink(insertElement(list, "li"), passage, null, (function (p, fn) {
					return function () {
						state.active.variables["#actions"][p] = true;
						if (typeof fn === "function") { fn(); }
					};
				}(passage, setFn)));
				if (image == null) { // use lazy equality
					insertText(el, text);
				} else {
					el.appendChild(image);
				}
				el.classList.add("link-" + this.name); // DEPRECATED
				el.classList.add("macro-" + this.name);
			}
		}
	});

	/**
	 * <<back>> & <<return>>
	 */
	macros.add(["back", "return"], {
		version : { major : 5, minor : 0, patch : 0 },
		handler : function () {
			var	steps = 1,
				pname,
				ltext = this.name[0].toUpperCase() + this.name.slice(1),
				ctext,
				image,
				el;

			// translate wiki link/image syntax into the <<back>>/<<return>> "to" syntax
			if (this.args.length === 1 && typeof this.args[0] === "object") {
				if (this.args[0].isImage) {
					// argument was in wiki image syntax
					image = document.createElement("img");
					image.src = this.args[0].source;
					if (this.args[0].hasOwnProperty("passage")) {
						image.setAttribute("data-passage", this.args[0].passage);
					}
					if (this.args[0].hasOwnProperty("title")) {
						image.title = this.args[0].title;
					}
					if (this.args[0].hasOwnProperty("align")) {
						image.align = this.args[0].align;
					}
					if (this.args[0].hasOwnProperty("link")) {
						this.args.push("to");
						this.args.push(this.args[0].link);
					}
					this.args[0] = null;
				} else {
					if (this.args[0].count === 1) {
						// simple link syntax: [[...]]
						this.args.push(this.args[0].link);
						this.args[0] = "to"
					} else {
						// pretty link syntax: [[...|...]]
						this.args.push("to");
						this.args.push(this.args[0].link);
						this.args[0] = this.args[0].text;
					}
				}
			}

			if (this.args.length === 1) {
				ctext = this.args[0];
			} else if (this.args.length !== 0) {
				if (this.args.length === 3) {
					ctext = this.args.shift();
				}

				if (this.args[0] === "go") {
					if (isNaN(this.args[1]) || this.args[1] < 1) {
						return this.error('argument following "go" must be a whole number greater than zero');
					}
					steps = (this.args[1] < state.length) ? this.args[1] : state.length - 1;
					pname = state.peek(steps).title;
					ltext += " (go " + steps + ")";
				} else if (this.args[0] === "to") {
					if (typeof this.args[1] === "object") {
						// argument was in wiki link syntax
						this.args[1] = this.args[1].link;
					}
					if (!tale.has(this.args[1])) {
						return this.error('passage "' + this.args[1] + '" does not exist');
					}
					if (this.name === "return") { // || config.disableHistoryTracking) // allow <<back>> to work like <<return>> when config.disableHistoryTracking is enabled
						pname = this.args[1];
						ltext += ' (to "' + pname + '")';
					} else {
						for (var i = state.length - 1; i >= 0; i--) {
							if (state.history[i].title === this.args[1]) {
								steps = (state.length - 1) - i;
								pname = this.args[1];
								ltext += ' (to "' + pname + '")';
								break;
							}
						}
					}
					if (pname == null) { // use lazy equality
						return this.error('cannot find passage "' + this.args[1] + '" in the current story history');
					}
				} else {
					return this.error('"' + this.args[0] + '" is not a valid action (go|to)');
				}
			}
			if (pname == null && state.length > 1) { // use lazy equality
				pname = state.peek(steps).title;
			}

			if (pname == null) { // use lazy equality
				return this.error("cannot find passage");
			} else if (steps === 0) {
				return this.error("already at the first passage in the current story history");
			}

			el = document.createElement("a");
			el.classList.add("link-internal");
			el.classList.add("link-" + this.name); // DEPRECATED
			el.classList.add("macro-" + this.name);
			if (steps > 0) {
				jQuery(el).click(function () {
					if (this.name === "back") {
						if (config.historyMode === History.Modes.Hash || config.disableHistoryControls) {
							return function () {
								// pop the history stack
								//   n.b. (steps > 0) is correct, since the stack only holds "clean" (i.e. non-rendered) states
								while (steps > 0 && state.length > 1) {
									state.pop();
									steps--;
								}
								// activate the new top since we popped the stack
								state.setActiveState(state.top);
								// display the passage
								state.display(pname, el, "replace");
							};
						} else {
							return function () {
								if (state.length > 1) {
									window.history.go(-(steps));
								}
							};
						}
					} else {
						return function () {
							state.display(pname, el);
						};
					}
				}.call(this));
			}
			if (image == null) { // use lazy equality
				insertText(el, ctext || this.self.dtext || ltext);
			} else {
				el.appendChild(image);
			}
			this.output.appendChild(el);
		},
		linktext : function () {
			if (this.args.length === 0) {
				delete this.self.dtext;
			} else {
				this.self.dtext = this.args[0];
			}
		}
	}, true);

	/**
	 * <<choice>>
	 */
	macros.add("choice", {
		version : { major : 5, minor : 0, patch : 0 },
		handler : function () {
			if (this.args.length === 0) {
				return this.error("no passage specified");
			}

			var	passage,
				text,
				image,
				setFn,
				choiceId = state.active.title,
				el;

			if (this.args.length === 1) {
				if (typeof this.args[0] === "object" && this.args[0].isImage) {
					// argument was in wiki image syntax
					image = document.createElement("img");
					image.src = this.args[0].source;
					if (this.args[0].hasOwnProperty("passage")) {
						image.setAttribute("data-passage", this.args[0].passage);
					}
					if (this.args[0].hasOwnProperty("title")) {
						image.title = this.args[0].title;
					}
					if (this.args[0].hasOwnProperty("align")) {
						image.align = this.args[0].align;
					}
					passage = this.args[0].link;
					setFn   = this.args[0].setFn;
				} else {
					if (typeof this.args[0] === "object") {
						// argument was in wiki link syntax
						text    = this.args[0].text;
						passage = this.args[0].link;
						setFn   = this.args[0].setFn;
					} else {
						// argument was simply the passage name
						text = passage = this.args[0];
					}
				}
			} else {
				// yes, the arguments are backwards
				passage  = this.args[0];
				text = this.args[1];
			}

			if (!state.active.variables.hasOwnProperty("#choice")) {
				state.active.variables["#choice"] = {};
			} else if (
				   state.active.variables["#choice"].hasOwnProperty(choiceId)
				&& state.active.variables["#choice"][choiceId]
			) {
				el = insertElement(this.output, "span");
				if (image == null) { // use lazy equality
					insertText(el, text);
				} else {
					el.appendChild(image);
				}
				el.classList.add("link-disabled");
				el.classList.add("link-" + this.name); // DEPRECATED
				el.classList.add("macro-" + this.name);
				return;
			}

			el = Wikifier.createInternalLink(this.output, passage, null, function () {
				state.active.variables["#choice"][choiceId] = true;
				if (typeof setFn === "function") { setFn(); }
			});
			if (image == null) { // use lazy equality
				insertText(el, text);
			} else {
				el.appendChild(image);
			}
			el.classList.add("link-" + this.name); // DEPRECATED
			el.classList.add("macro-" + this.name);
		}
	});

	/**
	 * <<link>>
	 */
	macros.add("link", {
		version      : { major : 4, minor : 0, patch : 0 },
		actionRegExp : /^disable|remove|keep|once$/, // `keep` and `once` are deprecated
		handler      : function () {
			if (this.args.length === 0) {
				return this.error("no link location specified");
			}

			var	link,
				text,
				image,
				external,
				setFn,
				actionRegExp = this.self.actionRegExp,
				action,
				el;

			if (this.args.length === 3) {
				action = this.args.pop();
			} else if (this.args.length === 2 && actionRegExp.test(this.args[1])) {
				action = this.args.pop();
			}
			if (action != null && !actionRegExp.test(action)) { // use lazy equality on null check
				return this.error('"' + action + '" is not a valid action (disable|remove)');
			}

			if (this.args.length === 2) {
				text = this.args[0];
				link  = this.args[1];
			} else {
				if (typeof this.args[0] === "object" && this.args[0].isImage) {
					// argument was in wiki image syntax
					image = document.createElement("img");
					image.src = this.args[0].source;
					if (this.args[0].hasOwnProperty("passage")) {
						image.setAttribute("data-passage", this.args[0].passage);
					}
					if (this.args[0].hasOwnProperty("title")) {
						image.title = this.args[0].title;
					}
					if (this.args[0].hasOwnProperty("align")) {
						image.align = this.args[0].align;
					}
					link     = this.args[0].link;
					external = this.args[0].external;
					setFn    = this.args[0].setFn;
				} else {
					if (typeof this.args[0] === "object") {
						// argument was in wiki link syntax
						text     = this.args[0].text;
						link     = this.args[0].link;
						external = this.args[0].external;
						setFn    = this.args[0].setFn;
					} else {
						// argument was simply the link location
						text = link = this.args[0];
					}
				}
			}
			if (external == null) { // use lazy equality
				external = Wikifier.isExternalLink(link);
			}

			if (action) {
				if (!state.active.variables.hasOwnProperty("#link")) {
					state.active.variables["#link"] = {};
				} else if (
					   state.active.variables["#link"].hasOwnProperty(link)
					&& state.active.variables["#link"][link]
				) {
					if (action === "disable" || action === "keep") {
						el = insertElement(this.output, "span");
						if (image == null) { // use lazy equality
							insertText(el, text);
						} else {
							el.appendChild(image);
						}
						el.classList.add("link-disabled");
						el.classList.add("link-" + this.name); // DEPRECATED
						el.classList.add("macro-" + this.name);
					}
					return;
				}
			}

			if (external) {
				el = Wikifier.createExternalLink(this.output, link);
			} else {
				el = Wikifier.createInternalLink(this.output, link, null, function () {
					if (action) { state.active.variables["#link"][link] = true; }
					if (typeof setFn === "function") { setFn(); }
				});
			}
			if (image == null) { // use lazy equality
				insertText(el, text);
			} else {
				el.appendChild(image);
			}
			el.classList.add("link-" + this.name); // DEPRECATED
			el.classList.add("macro-" + this.name);
		}
	});


	/*******************************************************************************************************************
	 * Display
	 ******************************************************************************************************************/
	/**
	 * <<display>>
	 */
	macros.add("display", {
		version : { major : 3, minor : 1, patch : 0 },
		handler : function () {
			if (this.args.length === 0) {
				return this.error("no passage specified");
			}

			var passage;

			if (typeof this.args[0] === "object") {
				// argument was in wiki link syntax
				passage = this.args[0].link;
			} else {
				// argument was simply the passage name
				passage = this.args[0];
			}
			if (!tale.has(passage)) {
				return this.error('passage "' + passage + '" does not exist');
			}

			var el = this.output;

			passage = tale.get(passage);
			if (this.args[1]) {
				el = insertElement(el, this.args[1], null, passage.domId);
				el.setAttribute("data-passage", passage.title);
			}
			new Wikifier(el, passage.processText());
		}
	});

	/**
	 * <<nobr>>
	 */
	macros.add("nobr", {
		version  : { major : 2, minor : 0, patch : 0 },
		skipArgs : true,
		tags     : null,
		handler  : function () {
			// wikify the contents, after removing all newlines
			new Wikifier(this.output, this.payload[0].contents.replace(/^\n+|\n+$/g, "").replace(/\n+/g, " "));
		}
	});

	/**
	 * <<print>>
	 */
	macros.add("print", {
		version  : { major : 3, minor : 0, patch : 0 },
		skipArgs : true,
		handler  : function () {
			if (this.args.full.length === 0) {
				return this.error("no expression specified");
			}

			try {
				var	result = printableStringOrDefault(Util.evalExpression(this.args.full), null);
				if (result !== null) {
					new Wikifier(this.output, result);
				}
			} catch (e) {
				return this.error("bad expression: " + e.message);
			}
		}
	});

	/**
	 * <<silently>>
	 */
	macros.add("silently", {
		version  : { major : 4, minor : 0, patch : 0 },
		skipArgs : true,
		tags     : null,
		handler  : function () {
			var	errTrap = document.createDocumentFragment(),
				errList = [];

			// wikify the contents
			new Wikifier(errTrap, this.payload[0].contents.trim());

			// discard the output, unless there were errors
			while (errTrap.hasChildNodes()) {
				var fc = errTrap.firstChild;
				if (fc.classList && fc.classList.contains("error")) { errList.push(fc.textContent); }
				errTrap.removeChild(fc);
			}
			if (errList.length > 0) {
				return this.error("error" + (errList.length === 1 ? "" : "s") + " within contents (" + errList.join('; ') + ")");
			}
		}
	});


	/*******************************************************************************************************************
	 * Control
	 ******************************************************************************************************************/
	/**
	 * <<if>>
	 */
	macros.add("if", {
		version  : { major : 4, minor : 0, patch : 0 },
		skipArgs : true,
		tags     : [ "elseif", "else" ],
		handler  : function () {
			try {
				for (var i = 0, len = this.payload.length; i < len; i++) {
					// sanity checks
					switch (this.payload[i].name) {
					case "else":
						if (this.payload[i].arguments.length !== 0) {
							if (/^\s*if\b/i.test(this.payload[i].arguments)) {
								return this.error(
									'whitespace is not allowed between the "else" and "if" in <<elseif>> clause'
									+ (i > 0 ? " (#" + i + ")" : "")
								);
							}
							return this.error(
								"<<else>> does not accept a conditional expression"
								+ " (perhaps you meant to use <<elseif>>), invalid: "
								+ this.payload[i].arguments
							);
						}
						break;
					default:
						if (this.payload[i].arguments.length === 0) {
							return this.error(
								"no conditional expression specified for <<" + this.payload[i].name
								+ ">> clause" + (i > 0 ? " (#" + i + ")" : "")
							);
						} else if (!config.macros.disableIfAssignmentError && /[^!=&^|<>*/%+-]=[^=]/.test(this.payload[i].arguments)) {
							return this.error(
								'assignment operator "=" found within <<'
								+ this.payload[i].name + ">> clause" + (i > 0 ? " (#" + i + ")" : "")
								+ " (perhaps you meant to use an equality operator:"
								+ ' ==, ===, eq, is), invalid: '
								+ this.payload[i].arguments
							);
						}
						break;
					}
					// conditional test
					if (this.payload[i].name === "else" || !!Wikifier.evalExpression(this.payload[i].arguments)) {
						new Wikifier(this.output, this.payload[i].contents);
						break;
					}
				}
			} catch (e) {
				return this.error(
					"bad conditional expression in <<" + (i === 0 ? "if" : "elseif") + ">> clause"
					+ (i > 0 ? " (#" + i + ")" : "") + ": " + e.message
				);
			}
		}
	});

	/**
	 * <<for>>, <<break>>, & <<continue>>
	 */
	macros.add("for", {
		version  : { major : 1, minor : 0, patch : 1 },
		skipArgs : true,
		tags     : null,
		handler  : function () {
			var	init,
				condition = this.args.full.trim(),
				post,
				parts,
				payload   = this.payload[0].contents.replace(/\n$/, ""),
				first     = true,
				safety    = config.macros.maxLoopIterations;

			if (condition.length === 0) {
				condition = true;
			} else if (condition.indexOf(";") !== -1) {
				if ((parts = condition.match(/^([^;]*?)\s*;\s*([^;]*?)\s*;\s*([^;]*?)$/)) !== null) {
					init      = parts[1];
					condition = parts[2];
					post      = parts[3];
				} else {
					return this.error("invalid 3-part syntax, format: init ; condition ; post");
				}
			}

			try {
				runtime.temp.break = null;
				if (init) {
					try {
						Util.evalExpression(init);
					} catch (e) {
						return this.error("bad init expression: " + e.message);
					}
				}
				while (!!Util.evalExpression(condition)) {
					if (--safety < 0) {
						return this.error("exceeded configured maximum loop iterations (" + config.macros.maxLoopIterations + ")");
					}
					new Wikifier(this.output, first ? payload.replace(/^\n/, "") : payload);
					if (first) {
						first = false;
					}
					if (runtime.temp.break != null) { // use lazy equality
						if (runtime.temp.break === 1) {
							runtime.temp.break = null;
						} else if (runtime.temp.break === 2) {
							runtime.temp.break = null;
							break;
						}
					}
					if (post) {
						try {
							Util.evalExpression(post);
						} catch (e) {
							return this.error("bad post expression: " + e.message);
						}
					}
				}
			} catch (e) {
				return this.error("bad conditional expression: " + e.message);
			} finally {
				runtime.temp.break = null;
			}
		}
	});
	macros.add(["break", "continue"], {
		version  : { major : 1, minor : 0, patch : 0 },
		skipArgs : true,
		handler  : function () {
			if (this.contextHas(function (c) { return c.name === "for"; })) {
				runtime.temp.break = (this.name === "continue") ? 1 : 2;
			} else {
				return this.error("must only be used in conjunction with its parent macro <<for>>");
			}
		}
	});


	/*******************************************************************************************************************
	 * Variables
	 ******************************************************************************************************************/
	/**
	 * <<set>>
	 */
	macros.add("set", {
		version  : { major : 3, minor : 1, patch : 0 },
		skipArgs : true,
		handler  : function () {
			if (this.args.full.length === 0) {
				return this.error("no expression specified");
			}

			macros.evalStatements(this.args.full, this);
		}
	});

	/**
	 * <<unset>>
	 */
	macros.add("unset", {
		version  : { major : 2, minor : 1, patch : 0 },
		skipArgs : true,
		handler  : function () {
			if (this.args.full.length === 0) {
				return this.error("no $variable list specified");
			}

			var	expression = this.args.full,
				re         = /state\.active\.variables\.(\w+)/g,
				match;

			while ((match = re.exec(expression)) !== null) {
				var name = match[1];

				if (state.active.variables.hasOwnProperty(name)) {
					delete state.active.variables[name];
				}
			}
		}
	});

	/**
	 * <<remember>>
	 */
	macros.add("remember", {
		version  : { major : 3, minor : 1, patch : 0 },
		skipArgs : true,
		handler  : function () {
			if (this.args.full.length === 0) {
				return this.error("no expression specified");
			}

			var expression = this.args.full;
			if (macros.evalStatements(expression, this)) {
				var	remember = storage.getItem("remember") || {},
					re       = /state\.active\.variables\.(\w+)/g,
					match;

				while ((match = re.exec(expression)) !== null) {
					var name = match[1];

					remember[name] = state.active.variables[name];
				}
				if (!storage.setItem("remember", remember)) {
					return this.error("unknown error, cannot remember: " + this.args.raw);
				}
			}
		},
		init : function () {
			var remember = storage.getItem("remember");
			if (remember) {
				Object.keys(remember).forEach(function (name) {
					state.active.variables[name] = remember[name];
				});
			}
		}
	});

	/**
	 * <<forget>>
	 */
	macros.add("forget", {
		version  : { major : 1, minor : 1, patch : 0 },
		skipArgs : true,
		handler  : function () {
			if (this.args.full.length === 0) {
				return this.error("no $variable list specified");
			}

			var	expression = this.args.full,
				re         = /state\.active\.variables\.(\w+)/g,
				match,
				remember   = storage.getItem("remember"),
				needStore  = false;

			while ((match = re.exec(expression)) !== null) {
				var name = match[1];

				if (state.active.variables.hasOwnProperty(name)) {
					delete state.active.variables[name];
				}
				if (remember && remember.hasOwnProperty(name)) {
					needStore = true;
					delete remember[name];
				}
			}
			if (needStore && !storage.setItem("remember", remember)) {
				return this.error("unknown error, cannot update remember store");
			}
		}
	});


	/*******************************************************************************************************************
	 * Scripting
	 ******************************************************************************************************************/
	/**
	 * <<run>>
	 */
	macros.add("run", "set"); // add <<run>> as an alias of <<set>>

	/**
	 * <<script>>
	 */
	macros.add("script", {
		version  : { major : 1, minor : 0, patch : 0 },
		skipArgs : true,
		tags     : null,
		handler  : function () {
			macros.evalStatements(this.payload[0].contents, this);
		}
	});


	/*******************************************************************************************************************
	 * Interactive
	 ******************************************************************************************************************/
	/**
	 * <<button>> & <<click>>
	 */
	macros.add(["button", "click"], {
		version : { major : 5, minor : 0, patch : 0 },
		tags    : null,
		handler : function () {
			if (this.args.length === 0) {
				return this.error("no " + (this.name === "click" ? "link" : "button") + " text specified");
			}

			var	widgetArgs = (function () {
					var wargs;
					if (
						   state.active.variables.hasOwnProperty("args")
						&& this.contextHas(function (c) { return c.self.isWidget; })
					) {
						wargs = state.active.variables.args;
					}
					return wargs;
				}.call(this)),
				el      = document.createElement(this.name === "click" ? "a" : "button"),
				passage;

			if (typeof this.args[0] === "object" && this.args[0].isImage) {
				// argument was in wiki image syntax
				var img = insertElement(el, "img");
				img.src = this.args[0].source;
				if (this.args[0].hasOwnProperty("passage")) {
					img.setAttribute("data-passage", this.args[0].passage);
				}
				if (this.args[0].hasOwnProperty("title")) {
					img.title = this.args[0].title;
				}
				if (this.args[0].hasOwnProperty("align")) {
					img.align = this.args[0].align;
				}
				passage = this.args[0].link;
			} else {
				var text;
				if (typeof this.args[0] === "object") {
					// argument was in wiki link syntax
					text    = this.args[0].text;
					passage = this.args[0].link;
				} else {
					// argument was simply the link text
					text    = this.args[0];
					passage = this.args.length > 1 ? this.args[1] : undefined;
				}
				insertText(el, text);
			}
			el.classList.add("link-" + (passage != null ? (tale.has(passage) ? "internal" : "broken") : "internal")); // use lazy equality
			el.classList.add("link-" + this.name); // DEPRECATED
			el.classList.add("macro-" + this.name);
			setupWikifyEvalEvent(jQuery(el), "click", {
				content    : this.payload[0].contents.trim(),
				widgetArgs : widgetArgs,
				callback   : passage != null ? function () { state.display(passage, el); } : undefined // use lazy equality
			});
			this.output.appendChild(el);
		}
	});

	/**
	 * <<checkbox>>
	 */
	macros.add("checkbox", {
		version : { major : 5, minor : 1, patch : 0 },
		handler : function () {
			if (this.args.length < 3) {
				var errors = [];
				if (this.args.length < 1) { errors.push("$variable name"); }
				if (this.args.length < 2) { errors.push("unchecked value"); }
				if (this.args.length < 3) { errors.push("checked value"); }
				return this.error("no " + errors.join(" or ") + " specified");
			}

			var	varName      = this.args[0].trim(),
				varId        = Util.slugify(varName),
				uncheckValue = this.args[1],
				checkValue   = this.args[2],
				el           = document.createElement("input");

			// legacy error
			if (varName[0] !== "$") {
				return this.error('$variable name "' + varName + '" is missing its sigil ($)');
			}

			el.type = "checkbox";
			el.id   = "checkbox-" + varId;
			el.name = "checkbox-" + varId;
			el.classList.add("macro-" + this.name);
			if (this.args.length > 3 && this.args[3] === "checked") {
				el.checked = true;
				Wikifier.setValue(varName, checkValue);
			} else {
				Wikifier.setValue(varName, uncheckValue);
			}
			jQuery(el).change(function () {
				Wikifier.setValue(varName, this.checked ? checkValue : uncheckValue);
			});
			this.output.appendChild(el);
		}
	});

	/**
	 * <<radiobutton>>
	 */
	macros.add("radiobutton", {
		version : { major : 5, minor : 1, patch : 0 },
		handler : function () {
			if (this.args.length < 2) {
				var errors = [];
				if (this.args.length < 1) { errors.push("$variable name"); }
				if (this.args.length < 2) { errors.push("checked value"); }
				return this.error("no " + errors.join(" or ") + " specified");
			}

			var	varName    = this.args[0].trim(),
				varId      = Util.slugify(varName),
				checkValue = this.args[1],
				el         = document.createElement("input");

			// legacy error
			if (varName[0] !== "$") {
				return this.error('$variable name "' + varName + '" is missing its sigil ($)');
			}

			if (!runtime.temp.hasOwnProperty("radiobutton")) {
				runtime.temp["radiobutton"] = {};
			}
			if (!runtime.temp["radiobutton"].hasOwnProperty(varId)) {
				runtime.temp["radiobutton"][varId] = 0;
			}

			el.type = "radio";
			el.id   = "radiobutton-" + varId + "-" + runtime.temp["radiobutton"][varId]++;
			el.name = "radiobutton-" + varId;
			el.classList.add("macro-" + this.name);
			if (this.args.length > 2 && this.args[2] === "checked") {
				el.checked = true;
				Wikifier.setValue(varName, checkValue);
			}
			jQuery(el).change(function () {
				if (this.checked) {
					Wikifier.setValue(varName, checkValue);
				}
			});
			this.output.appendChild(el);
		}
	});

	/**
	 * <<textarea>>
	 */
	macros.add("textarea", {
		version : { major : 1, minor : 0, patch : 0 },
		handler : function () {
			if (this.args.length < 2) {
				var errors = [];
				if (this.args.length < 1) { errors.push("$variable name"); }
				if (this.args.length < 2) { errors.push("default value"); }
				return this.error("no " + errors.join(" or ") + " specified");
			}

			var	varName      = this.args[0].trim(),
				varId        = Util.slugify(varName),
				defaultValue = this.args[1],
				autofocus    = this.args[2] === "autofocus",
				el           = document.createElement("textarea"),
				passage;

			// legacy error
			if (varName[0] !== "$") {
				return this.error('$variable name "' + varName + '" is missing its sigil ($)');
			}

			el.id   = "textarea-" + varId;
			el.name = "textarea-" + varId;
			el.rows = 4;
			el.cols = 68;
			// ideally, we should be setting the .defaultValue property here, but IE doesn't support
			// it yet, so we have to use .textContent, which is equivalent to .defaultValue anyway
			el.textContent = defaultValue;
			if (autofocus) {
				el.setAttribute("autofocus", "autofocus");
			}
			el.classList.add("macro-" + this.name);
			Wikifier.setValue(varName, defaultValue);
			jQuery(el).change(function () {
				Wikifier.setValue(varName, this.value);
			});
			this.output.appendChild(el);

			// setup a single-use post-display task to autofocus the element, if necessary
			if (autofocus) {
				postdisplay["#autofocus:" + el.id] = function (task) {
					setTimeout(function () { el.focus(); }, 1);
					delete postdisplay[task]; // single-use task
				};
			}
		}
	});

	/**
	 * <<textbox>>
	 */
	macros.add("textbox", {
		version : { major : 5, minor : 1, patch : 0 },
		handler : function () {
			if (this.args.length < 2) {
				var errors = [];
				if (this.args.length < 1) { errors.push("$variable name"); }
				if (this.args.length < 2) { errors.push("default value"); }
				return this.error("no " + errors.join(" or ") + " specified");
			}

			var	varName      = this.args[0].trim(),
				varId        = Util.slugify(varName),
				defaultValue = this.args[1],
				autofocus    = false,
				el           = document.createElement("input"),
				passage;

			// legacy error
			if (varName[0] !== "$") {
				return this.error('$variable name "' + varName + '" is missing its sigil ($)');
			}

			if (this.args.length > 3) {
				passage   = this.args[2];
				autofocus = (this.args[3] === "autofocus");
			} else if (this.args.length > 2) {
				if (this.args[2] === "autofocus") {
					autofocus = true;
				} else {
					passage = this.args[2];
				}
			}

			el.type  = "text";
			el.id    = "textbox-" + varId;
			el.name  = "textbox-" + varId;
			el.value = defaultValue;
			if (autofocus) {
				el.setAttribute("autofocus", "autofocus");
			}
			el.classList.add("macro-" + this.name);
			Wikifier.setValue(varName, defaultValue);
			jQuery(el)
				.change(function () {
					Wikifier.setValue(varName, this.value);
				})
				.keypress(function (evt) {
					// if Return/Enter is pressed, set the $variable and, optionally, forward to another passage
					if (evt.which === 13) { // 13 is Return/Enter
						evt.preventDefault();
						Wikifier.setValue(varName, this.value);
						if (typeof passage !== "undefined") {
							state.display(passage, this);
						}
					}
				});
			this.output.appendChild(el);

			// setup a single-use post-display task to autofocus the element, if necessary
			if (autofocus) {
				postdisplay["#autofocus:" + el.id] = function (task) {
					setTimeout(function () { el.focus(); }, 1);
					delete postdisplay[task]; // single-use task
				};
			}
		}
	});


	/*******************************************************************************************************************
	 * DOM (Classes)
	 ******************************************************************************************************************/
	/**
	 * <<addclass>> & <<toggleclass>>
	 */
	macros.add(["addclass", "toggleclass"], {
		version : { major : 2, minor : 0, patch : 1 },
		handler : function () {
			if (this.args.length < 2) {
				var errors = [];
				if (this.args.length < 1) { errors.push("selector"); }
				if (this.args.length < 2) { errors.push("class names"); }
				return this.error("no " + errors.join(" or ") + " specified");
			}

			var $targets = jQuery(this.args[0]);

			if ($targets.length === 0) {
				return this.error('no elements matched the selector "' + this.args[0] + '"');
			}

			switch (this.name) {
			case "addclass":
				$targets.addClass(this.args[1].trim());
				break;
			case "toggleclass":
				$targets.toggleClass(this.args[1].trim());
				break;
			}
		}
	});

	/**
	 * <<removeclass>>
	 */
	macros.add("removeclass", {
		version : { major : 1, minor : 0, patch : 1 },
		handler : function () {
			if (this.args.length === 0) {
				return this.error("no selector specified");
			}

			var $targets = jQuery(this.args[0]);

			if ($targets.length === 0) {
				return this.error('no elements matched the selector "' + this.args[0] + '"');
			}

			if (this.args.length > 1) {
				$targets.removeClass(this.args[1].trim());
			} else {
				$targets.removeClass();
			}
		}
	});


	/*******************************************************************************************************************
	 * DOM (Content)
	 ******************************************************************************************************************/
	/**
	 * <<append>>, <<prepend>>, & <<replace>>
	 */
	macros.add(["append", "prepend", "replace"], {
		version : { major : 2, minor : 1, patch : 0 },
		tags    : null,
		handler : function () {
			if (this.args.length === 0) {
				return this.error("no selector specified");
			}

			var $targets = jQuery(this.args[0]);

			if ($targets.length === 0) {
				return this.error('no elements matched the selector "' + this.args[0] + '"');
			}

			if (this.name === "replace") {
				$targets.empty();
			}
			if (this.payload[0].contents !== "") {
				var frag = document.createDocumentFragment();
				new Wikifier(frag, this.payload[0].contents);
				switch (this.name) {
				case "replace":
				case "append":
					$targets.append(frag);
					break;
				case "prepend":
					$targets.prepend(frag);
					break;
				}
			}
		}
	});

	/**
	 * <<remove>>
	 */
	macros.add("remove", {
		version : { major : 1, minor : 0, patch : 1 },
		handler : function () {
			if (this.args.length === 0) {
				return this.error("no selector specified");
			}

			var $targets = jQuery(this.args[0]);

			if ($targets.length === 0) {
				return this.error('no elements matched the selector "' + this.args[0] + '"');
			}

			$targets.remove();
		}
	});


	/*******************************************************************************************************************
	 * Miscellaneous
	 ******************************************************************************************************************/
	/**
	 * <<goto>>
	 */
	macros.add("goto", {
		version : { major : 1, minor : 0, patch : 0 },
		handler : function () {
			if (this.args.length === 0) {
				return this.error("no passage specified");
			}

			var passage;

			if (typeof this.args[0] === "object") {
				// argument was in wiki link syntax
				passage = this.args[0].link;
			} else {
				// argument was simply the passage name
				passage = this.args[0];
			}
			if (!tale.has(passage)) {
				return this.error('passage "' + passage + '" does not exist');
			}

			// call state.display()
			//   n.b. this does not terminate the current Wikifier call chain, though, ideally, it probably
			//        should, however, doing so wouldn't be trivial and there's the question of would that
			//        behavior be unwanted by users, who are used to the current behavior from similar macros
			//        and constructs
			setTimeout(function () {
				state.display(passage);
			}, 40); // not too short, not too long
		}
	});

	/**
	 * <<widget>>
	 */
	macros.add("widget", {
		version : { major : 2, minor : 1, patch : 0 },
		tags    : null,
		handler : function () {
			if (this.args.length === 0) {
				return this.error("no widget name specified");
			}

			var widgetName = this.args[0];

			if (macros.has(widgetName)) {
				if (!macros.get(widgetName).isWidget) {
					return this.error('cannot clobber existing macro "' + widgetName + '"');
				}

				// remove existing widget
				macros.remove(widgetName);
			}

			try {
				macros.add(widgetName, {
					version  : { major : 1, minor : 0, patch : 0 },
					isWidget : true,
					handler  : (function (contents) {
						return function () {
							var argsCache;
							try {
								// cache the existing $args variable, if any
								if (state.active.variables.hasOwnProperty("args")) {
									argsCache = state.active.variables.args;
								}

								// setup the widget arguments array
								state.active.variables.args = [];
								for (var i = 0, len = this.args.length; i < len; i++) {
									state.active.variables.args[i] = this.args[i];
								}
								state.active.variables.args.raw = this.args.raw;
								state.active.variables.args.full = this.args.full;

								// setup the error trapping variables
								var	outFrag = document.createDocumentFragment(),
									resFrag = document.createDocumentFragment(),
									errList = [];

								// wikify the widget contents
								new Wikifier(resFrag, contents);

								// carry over the output, unless there were errors
								while (resFrag.hasChildNodes()) {
									var fc = resFrag.firstChild;
									if (fc.classList && fc.classList.contains("error")) { errList.push(fc.textContent); }
									outFrag.appendChild(fc);
								}
								if (errList.length === 0) {
									this.output.appendChild(outFrag);
								} else {
									return this.error("error" + (errList.length === 1 ? "" : "s") + " within widget contents (" + errList.join('; ') + ")");
								}
							} catch (e) {
								return this.error("cannot execute widget: " + e.message);
							} finally {
								// teardown the widget arguments array
								delete state.active.variables.args;

								// restore the cached $args variable, if any
								if (typeof argsCache !== "undefined") {
									state.active.variables.args = argsCache;
								}
							}
						};
					}(this.payload[0].contents))
				});
			} catch (e) {
				return this.error('cannot create widget macro "' + widgetName + '": ' + e.message);
			}
		}
	});


	/*******************************************************************************************************************
	 * Audio
	 ******************************************************************************************************************/
	if (!has.audio) {
		macros.add(["audio", "stopallaudio", "cacheaudio", "playlist", "setplaylist"], {
			version : { major: 1, minor: 0, revision: 0 },
			handler : function () { /* empty */ }
		});
	} else {
		/**
		 * <<audio>>
		 */
		macros.add("audio", {
			version : { major: 1, minor: 2, revision: 0 },
			handler : function () {
				if (this.args.length < 2) {
					var errors = [];
					if (this.args.length < 1) { errors.push("track ID"); }
					if (this.args.length < 2) { errors.push("actions"); }
					return this.error("no " + errors.join(" or ") + " specified");
				}

				var	tracks = macros.get("cacheaudio").tracks,
					id     = this.args[0];

				if (!tracks.hasOwnProperty(id)) {
					return this.error("no track by ID: " + id);
				}

				var	audio    = tracks[id],
					action,
					volume,
					mute,
					time,
					loop,
					fadeTo,
					fadeOver = 5,
					passage,
					raw;

				// process arguments
				var args = this.args.slice(1);
				while (args.length > 0) {
					var arg = args.shift();
					switch (arg) {
					case "play":
					case "pause":
					case "stop":
						action = arg;
						break;
					case "fadein":
						action = "fade";
						fadeTo = 1;
						break;
					case "fadeout":
						action = "fade";
						fadeTo = 0;
						break;
					case "fadeto":
						if (args.length === 0) {
							return this.error("fadeto missing required level value");
						}
						action = "fade";
						raw = args.shift();
						fadeTo = parseFloat(raw);
						if (isNaN(fadeTo) || !isFinite(fadeTo)) {
							return this.error("cannot parse fadeto: " + raw);
						}
						break;
					case "fadeoverto":
						if (args.length < 2) {
							var errors = [];
							if (args.length < 1) { errors.push("seconds"); }
							if (args.length < 2) { errors.push("level"); }
							return this.error("fadeoverto missing required " + errors.join(" and ")
								+ " value" + (errors.length > 1 ? "s" : ""));
						}
						action = "fade";
						raw = args.shift();
						fadeOver = parseFloat(raw);
						if (isNaN(fadeOver) || !isFinite(fadeOver)) {
							return this.error("cannot parse fadeoverto: " + raw);
						}
						raw = args.shift();
						fadeTo = parseFloat(raw);
						if (isNaN(fadeTo) || !isFinite(fadeTo)) {
							return this.error("cannot parse fadeoverto: " + raw);
						}
						break;
					case "volume":
						if (args.length === 0) {
							return this.error("volume missing required level value");
						}
						raw = args.shift();
						volume = parseFloat(raw);
						if (isNaN(volume) || !isFinite(volume)) {
							return this.error("cannot parse volume: " + raw);
						}
						break;
					case "mute":
					case "unmute":
						mute = arg === "mute";
						break;
					case "time":
						if (args.length === 0) {
							return this.error("time missing required seconds value");
						}
						raw = args.shift();
						time = parseFloat(raw);
						if (isNaN(time) || !isFinite(time)) {
							return this.error("cannot parse time: " + raw);
						}
						break;
					case "loop":
					case "unloop":
						loop = arg === "loop";
						break;
					case "goto":
						if (args.length === 0) {
							return this.error("goto missing required passage title");
						}
						raw = args.shift();
						if (typeof raw === "object") {
							// argument was in wiki link syntax
							passage = raw.link;
						} else {
							// argument was simply the passage name
							passage = raw;
						}
						if (!tale.has(passage)) {
							return this.error('passage "' + passage + '" does not exist');
						}
						break;
					default:
						return this.error("unknown action: " + arg);
					}
				}

				try {
					if (volume != null) { // use lazy equality
						audio.volume = volume;
					}
					if (time != null) { // use lazy equality
						audio.time = time;
					}
					if (mute != null) { // use lazy equality
						if (mute) {
							audio.mute();
						} else {
							audio.unmute();
						}
					}
					if (loop != null) { // use lazy equality
						if (loop) {
							audio.loop();
						} else {
							audio.unloop();
						}
					}
					if (passage != null) { // use lazy equality
						audio.oneEnd(function (evt) { // execute the callback once only
							state.display(passage);
						});
					}
					switch (action) {
					case "play":
						audio.play();
						break;
					case "pause":
						audio.pause();
						break;
					case "stop":
						audio.stop();
						break;
					case "fade":
						if (audio.volume === fadeTo) {
							if (fadeTo === 0) {
								audio.volume = 1;
							} else if (fadeTo === 1) {
								audio.volume = 0;
							}
						}
						audio.fadeWithDuration(fadeOver, audio.volume, fadeTo);
						break;
					}
				} catch (e) {
					return this.error("error playing audio: " + e.message);
				}
			}
		});

		/**
		 * <<stopallaudio>>
		 */
		macros.add("stopallaudio", {
			version : { major: 1, minor: 0, revision: 0 },
			handler : function () {
				var tracks = macros.get("cacheaudio").tracks;
				Object.keys(tracks).forEach(function (id) {
					tracks[id].stop();
				});
			}
		});

		/**
		 * <<cacheaudio>>
		 */
		macros.add("cacheaudio", {
			version : { major: 1, minor: 0, revision: 1 },
			handler : function () {
				if (this.args.length < 2) {
					var errors = [];
					if (this.args.length < 1) { errors.push("track ID"); }
					if (this.args.length < 2) { errors.push("sources"); }
					return this.error("no " + errors.join(" or ") + " specified");
				}

				var	types   = this.self.types,
					canPlay = this.self.canPlay,
					/*
						Use `document.createElement("audio")` in favor of `new Audio()` as
						the latter is treated differently (i.e. unfavorably) in certain cases,
						chiefly in mobile browsers.
					*/
					audio   = document.createElement("audio"),
					id      = this.args[0],
					extRe   = /\.([^\.\/\\]+)$/;

				for (var i = 1; i < this.args.length; i++) {
					var	url   = this.args[i],
						match = extRe.exec(Util.parseUrl(url).pathname);

					if (match === null) {
						continue;
					}

					var	ext  = match[1].toLowerCase(),
						type = types.hasOwnProperty(ext) ? types[ext] : "audio/" + ext;

					// determine and cache the canPlay status
					if (!canPlay.hasOwnProperty(type)) {
						canPlay[type] = audio.canPlayType(type).replace(/^no$/i, "") !== ""; // some early implementations return "no" instead of the empty string
					}

					if (canPlay[type]) {
						var source  = document.createElement("source");
						source.src  = url;
						source.type = type;
						audio.appendChild(source);
					}
				}

				// if it contains any <source> elements, wrap the <audio> element and add it to the tracks
				if (audio.hasChildNodes()) {
					audio.preload = "auto";
					this.self.tracks[id] = new AudioWrapper(audio);
				}
			},
			types : Object.freeze({
				/*
					Define the supported audio types via MIME-type (incl. the codecs property).

					n.b. Opera (Presto) will return a false-negative if the codecs value is quoted.
					     Opera (Blink) will return a false-negative for WAVE audio if the preferred
					     MIME-type of "audio/wave" is specified, instead "audio/wav" must be used.
				*/
				mp3  : 'audio/mpeg; codecs=mp3',
				ogg  : 'audio/ogg; codecs=vorbis',
				webm : 'audio/webm; codecs=vorbis',
				wav  : 'audio/wav; codecs=1'
			}),
			canPlay : {},
			tracks : {}
		});

		/**
		 * <<playlist>>
		 */
		macros.add("playlist", {
			version : { major: 1, minor: 3, revision: 0 },
			handler : function () {
				if (this.args.length === 0) {
					return this.error("no actions specified");
				}

				var	self     = this.self,
					action,
					volume,
					mute,
					loop,
					shuffle,
					fadeTo,
					fadeOver = 5,
					raw;

				// process arguments
				var args = this.args.slice(0);
				while (args.length > 0) {
					var arg = args.shift();
					switch (arg) {
					case "play":
					case "pause":
					case "stop":
						action = arg;
						break;
					case "fadein":
						action = "fade";
						fadeTo = 1;
						break;
					case "fadeout":
						action = "fade";
						fadeTo = 0;
						break;
					case "fadeto":
						if (args.length === 0) {
							return this.error("fadeto missing required level value");
						}
						action = "fade";
						raw = args.shift();
						fadeTo = parseFloat(raw);
						if (isNaN(fadeTo) || !isFinite(fadeTo)) {
							return this.error("cannot parse fadeto: " + raw);
						}
						break;
					case "fadeoverto":
						if (args.length < 2) {
							var errors = [];
							if (args.length < 1) { errors.push("seconds"); }
							if (args.length < 2) { errors.push("level"); }
							return this.error("fadeoverto missing required " + errors.join(" and ")
								+ " value" + (errors.length > 1 ? "s" : ""));
						}
						action = "fade";
						raw = args.shift();
						fadeOver = parseFloat(raw);
						if (isNaN(fadeOver) || !isFinite(fadeOver)) {
							return this.error("cannot parse fadeoverto: " + raw);
						}
						raw = args.shift();
						fadeTo = parseFloat(raw);
						if (isNaN(fadeTo) || !isFinite(fadeTo)) {
							return this.error("cannot parse fadeoverto: " + raw);
						}
						break;
					case "volume":
						if (args.length === 0) {
							return this.error("volume missing required level value");
						}
						raw = args.shift();
						volume = parseFloat(raw);
						if (isNaN(volume) || !isFinite(volume)) {
							return this.error("cannot parse volume: " + raw);
						}
						break;
					case "mute":
					case "unmute":
						mute = arg === "mute";
						break;
					case "loop":
					case "unloop":
						loop = arg === "loop";
						break;
					case "shuffle":
					case "unshuffle":
						shuffle = arg === "shuffle";
						break;
					default:
						return this.error("unknown action: " + arg);
					}
				}

				try {
					if (volume != null) { // use lazy equality
						self.setVolume(volume);
					}
					if (mute != null) { // use lazy equality
						self.muted = mute;
						if (mute) {
							self.mute();
						} else {
							self.unmute();
						}
					}
					if (loop != null) { // use lazy equality
						self.loop = loop;
					}
					if (shuffle != null) { // use lazy equality
						self.shuffle = shuffle;
						self.buildList();
					}
					switch (action) {
					case "play":
						self.play();
						break;
					case "pause":
						self.pause();
						break;
					case "stop":
						self.stop();
						break;
					case "fade":
						if (self.volume === fadeTo) {
							if (fadeTo === 0) {
								self.setVolume(1);
							} else if (fadeTo === 1) {
								self.setVolume(0);
							}
						}
						self.fade(fadeOver, fadeTo);
						break;
					}
				} catch (e) {
					return this.error("error playing audio: " + e.message);
				}
			},
			play : function () {
				if (this.list.length === 0) {
					this.buildList();
				}
				if (this.current === null || this.current.isEnded()) {
					this.next();
				}
				this.current.play();
			},
			pause : function () {
				if (this.current !== null) {
					this.current.pause();
				}
			},
			stop : function () {
				if (this.current !== null) {
					this.current.stop();
				}
			},
			fade : function (over, to) {
				if (this.list.length === 0) {
					this.buildList();
				}
				if (this.current === null || this.current.isEnded()) {
					this.next();
				} else {
					this.current.volume = this.volume;
				}
				this.current.fadeWithDuration(over, this.current.volume, to);
				this.volume = to; // kludgey, but necessary
			},
			mute : function () {
				if (this.current !== null) {
					this.current.mute();
				}
			},
			unmute : function () {
				if (this.current !== null) {
					this.current.unmute();
				}
			},
			next : function () {
				this.current = this.list.shift();
				this.current.volume = this.volume;
			},
			setVolume : function (vol) {
				this.volume = vol;
				if (this.current !== null) {
					this.current.volume = vol;
				}
			},
			onEnd : function (evt) {
				var	thisp = macros.get("playlist");
				if (thisp.list.length === 0) {
					if (!thisp.loop) {
						return;
					}
					thisp.buildList();
				}
				thisp.next();
				if (thisp.muted) {
					thisp.mute();
				}
				thisp.current.play();
			},
			buildList : function () {
				this.list = this.tracks.slice(0);
				if (this.shuffle) {
					this.list.shuffle();

					// try not to immediately replay the last track when shuffling
					if (this.list.length > 1 && this.list[0] === this.current) {
						this.list.push(this.list.shift());
					}
				}
			},
			tracks  : [],
			list    : [],
			current : null,
			volume  : 1,
			muted   : false,
			loop    : true,
			shuffle : false
		});

		/**
		 * <<setplaylist>>
		 */
		macros.add("setplaylist", {
			version : { major: 2, minor: 0, revision: 1 },
			handler : function () {
				if (this.args.length === 0) {
					return this.error("no track ID(s) specified");
				}

				var	tracks   = macros.get("cacheaudio").tracks,
					playlist = macros.get("playlist"),
					list     = [];

				for (var i = 0; i < this.args.length; i++) {
					var	id = this.args[i];
					if (!tracks.hasOwnProperty(id)) {
						return this.error("no track by ID: " + id);
					}
					var track = tracks[id].clone();
					track.stop();
					track.unloop();
					track.unmute();
					track.volume = 1;
					jQuery(track.audio)
						.off("ended")
						.on("ended.macros:playlist", playlist.onEnd);
					list.push(track);
				}
				if (playlist.current !== null) {
					playlist.current.pause();
				}
				playlist.tracks  = list;
				playlist.list    = [];
				playlist.current = null;
				playlist.volume  = 1;
				playlist.muted   = false;
				playlist.loop    = true;
				playlist.shuffle = false;
			}
		});
	}


	/*******************************************************************************************************************
	 * Options
	 ******************************************************************************************************************/
	/**
	 * <<optionlist>> & <<optiontoggle>>
	 */
	macros.add(["optiontoggle", "optionlist"], {
		version : { major : 2, minor : 1, patch : 0 },
		tags    : [ "onchange" ],
		handler : function () {
			if (this.args.length === 0) {
				return this.error("no option property specified");
			}
			if (this.name === "optionlist" && this.args.length < 2) {
				return this.error("no list specified");
			}

			var	propertyName = this.args[0],
				propertyId   = Util.slugify(propertyName),
				elOption     = document.createElement("div"),
				elLabel      = document.createElement("div"),
				elControl    = document.createElement("div");

			elOption.appendChild(elLabel);
			elOption.appendChild(elControl);
			elOption.id  = "option-body-" + propertyId;
			elLabel.id   = "option-label-" + propertyId;
			elControl.id = "option-control-" + propertyId;
			elControl.classList.add("macro-" + this.name);

			// setup the label
			new Wikifier(elLabel, this.payload[0].contents.trim());

			// setup the control
			var onChangeContents = this.payload.length === 2 ? this.payload[1].contents.trim() : "";
			if (!options.hasOwnProperty(propertyName)) {
				options[propertyName] = undefined;
			}
			switch (this.name) {
			case "optiontoggle":
				var	text     = this.args.length > 1 ? this.args[1] : undefined,
					elInput  = document.createElement("a");
				if (options[propertyName] === undefined) {
					options[propertyName] = false;
				}
				if (options[propertyName]) {
					insertText(elInput, text || "On");
					elInput.classList.add("enabled");
				} else {
					insertText(elInput, text || "Off");
				}
				jQuery(elInput).click(function () {
					return function (evt) {
						removeChildren(elInput);
						if (options[propertyName]) {
							insertText(elInput, text || "Off");
							elInput.classList.remove("enabled");
							options[propertyName] = false;
						} else {
							insertText(elInput, text || "On");
							elInput.classList.add("enabled");
							options[propertyName] = true;
						}
						macros.get("saveoptions").handler();

						// if <<onchange>> exists, execute the contents and discard the output (if any)
						if (onChangeContents !== "") {
							new Wikifier(document.createElement("div"), onChangeContents);
						}
					}
				}());
				break;
			case "optionlist":
				var	items   = this.args[1],
					elInput = document.createElement("select");
				if (!Array.isArray(items)) {
					if (options.hasOwnProperty(items)) {
						items = options[items];
					} else {
						items = items.trim().split(/\s*,\s*/);
					}
				}
				if (options[propertyName] === undefined) {
					options[propertyName] = items[0];
				}
				for (var i = 0; i < items.length; i++) {
					var elItem = document.createElement("option");
					insertText(elItem, items[i]);
					elInput.appendChild(elItem);
				}
				elInput.value = options[propertyName];
				jQuery(elInput).change(function () {
					return function (evt) {
						options[propertyName] = evt.target.value;
						macros.get("saveoptions").handler();

						// if <<onchange>> exists, execute the contents and discard the output (if any)
						if (onChangeContents !== "") {
							new Wikifier(document.createElement("div"), onChangeContents);
						}
					}
				}());
				break;
			}
			elInput.id = "option-input-" + propertyId;
			elControl.appendChild(elInput);

			this.output.appendChild(elOption);
		}
	});

	/**
	 * <<optionbar>>
	 */
	macros.add("optionbar", {
		version : { major : 3, minor : 1, patch : 0 },
		handler : function () {
			var	elSet   = document.createElement("ul"),
				elOK    = document.createElement("li"),
				elReset = document.createElement("li");

			elSet.appendChild(elOK);
			elSet.appendChild(elReset);
			elSet.classList.add("buttons");
			elSet.classList.add("macro-" + this.name);

			elOK.appendChild(insertElement(null, "button", "options-ok", "ui-close", "OK"));
			elReset.appendChild(insertElement(null, "button", "options-reset", "ui-close", "Reset to Defaults"));

			jQuery("button", elReset).click(function (evt) {
				macros.get("deleteoptions").handler();
				window.location.reload();
			});

			this.output.appendChild(elSet);
		},
	});

	/**
	 * <<saveoptions>>
	 */
	macros.add("saveoptions", {
		version : { major : 2, minor : 0, patch : 0 },
		handler : function () {
			return storage.setItem("options", options);
		},
		init : function () {
			var opts = storage.getItem("options");
			if (opts !== null) {
				Object.keys(opts).forEach(function (name) {
					options[name] = opts[name];
				});
			}
		}
	});

	/**
	 * <<deleteoptions>>
	 */
	macros.add("deleteoptions", {
		version : { major : 2, minor : 0, patch : 0 },
		handler : function () {
			options = {};
			if (!storage.removeItem("options")) {
				return this.error("unknown error, cannot update options store");
			}
		}
	});
}

