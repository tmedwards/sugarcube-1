/***********************************************************************************************************************
 *
 * uisystem.js
 *
 * Copyright © 2013–2015 Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
 * Use of this source code is governed by a Simplified BSD License which can be found in the LICENSE file.
 *
 **********************************************************************************************************************/

var UISystem = (function () {
	"use strict";

	var
		_overlay = null,
		_body    = null,
		_closer  = null;


	/*******************************************************************************************************************
	 * Initialization
	 ******************************************************************************************************************/
	function init() {
		if (DEBUG) { console.log("[UISystem.init()]"); }

		// remove #init-no-js & #init-lacking from #init-screen
		jQuery("#init-no-js, #init-lacking").remove();

		// generate the UI elements and add them to the page
		var	store  = document.getElementById("store-area"),
			uiTree = document.createDocumentFragment(),
			temp   = document.createElement("div");

		// generate the core elements
		temp.innerHTML = tale.has("StoryFormatMarkup")
			? tale.get("StoryFormatMarkup").text.trim()
			:     '<div id="ui-bar">'
				+     '<header id="title" role="banner">'
				+         '<div id="story-banner"></div>'
				+         '<h1 id="story-title"></h1>'
				+         '<div id="story-subtitle"></div>'
				+         '<div id="story-title-separator"></div>'
				+         '<p id="story-author"></p>'
				+     '</header>'
				+     '<div id="story-caption"></div>'
				+     '<nav id="menu" role="navigation">'
				+         '<ul id="menu-story"></ul>'
				+         '<ul id="menu-core">'
				+             '<li id="menu-saves"><a>Saves</a></li>'
				+             '<li id="menu-rewind"><a>Rewind</a></li>'
				+             '<li id="menu-restart"><a>Restart</a></li>'
				+             '<li id="menu-options"><a>Options</a></li>'
				+             '<li id="menu-share"><a>Share</a></li>'
				+         '</ul>'
				+     '</nav>'
				+ '</div>'
				+ '<div id="passages" role="main"></div>';
		while (temp.hasChildNodes()) {
			uiTree.appendChild(temp.firstChild);
		}

		// generate and cache the dialog elements
		_overlay = insertElement(uiTree, "div", "ui-overlay", "ui-close");
		_body    = insertElement(uiTree, "div", "ui-body");
		_closer  = insertElement(uiTree, "a", "ui-body-close", "ui-close", "\ue002");

		// insert the UI elements into the page before the store area
		store.parentNode.insertBefore(uiTree, store);
	}


	/*******************************************************************************************************************
	 * Internals
	 ******************************************************************************************************************/
	function start() {
		if (DEBUG) { console.log("[UISystem.start()]"); }

		var $html = jQuery(document.documentElement);

		// setup the title
		if (TWINE1) {
			setPageElement("story-title", "StoryTitle", tale.title);
		} else {
			jQuery("#story-title").empty().append(tale.title);
		}

		// setup the dynamic page elements
		if (!tale.has("StoryCaption")) {
			jQuery("#story-caption").remove();
		}
		if (!tale.has("StoryMenu") && !tale.has("MenuStory")) {
			jQuery("#menu-story").remove();
		}
		setPageElements();

		// setup Saves menu
		uiAddClickHandler("#menu-saves a", null, function () { buildDialogSaves(); });

		// setup Rewind menu
		if (!config.disableHistoryTracking && tale.lookup("tags", "bookmark").length > 0) {
			uiAddClickHandler(jQuery("#menu-rewind a"), null, function () { buildDialogRewind(); });
		} else {
			jQuery("#menu-rewind").remove();
		}

		// setup Restart menu
		uiAddClickHandler("#menu-restart a", null, function () { buildDialogRestart(); });

		// setup Options menu
		if (tale.has("MenuOptions")) {
			uiAddClickHandler(jQuery("#menu-options a"), null, function () { buildDialogOptions(); });
		} else {
			jQuery("#menu-options").remove();
		}

		// setup Share menu
		if (tale.has("MenuShare")) {
			uiAddClickHandler(jQuery("#menu-share a"), null, function () { buildDialogShare(); });
		} else {
			jQuery("#menu-share").remove();
		}

		// handle the loading screen
		if (document.readyState === "complete") {
			$html.removeClass("init-loading");
		}
		document.addEventListener("readystatechange", function () {
			// readyState can be: "loading", "interactive", or "complete"
			if (document.readyState === "complete") {
				if (config.loadDelay > 0) {
					setTimeout(function () { $html.removeClass("init-loading"); }, config.loadDelay);
				} else {
					$html.removeClass("init-loading");
				}
			} else {
				$html.addClass("init-loading");
			}
		}, false);
	}

	function setPageElements() {
		if (DEBUG) { console.log("[UISystem.setPageElements()]"); }

		// setup the dynamic page elements
		setPageElement("story-banner", "StoryBanner");
		setPageElement("story-subtitle", "StorySubtitle");
		setPageElement("story-author", "StoryAuthor");
		setPageElement("story-caption", "StoryCaption");

		var menuStory = document.getElementById("menu-story");
		if (menuStory !== null) {
			removeChildren(menuStory);
			if (tale.has("StoryMenu")) {
				buildListFromPassage("StoryMenu", menuStory);
			} else if (tale.has("MenuStory")) {
				buildListFromPassage("MenuStory", menuStory);
			}
		}
	}

	function buildDialogSaves() {
		function createActionItem(bId, bClass, bText, bAction) {
			var	li  = document.createElement("li"),
				btn = document.createElement("button");
			btn.id = "saves-" + bId;
			if (bClass) {
				btn.className = bClass;
			}
			btn.innerHTML = bText;
			jQuery(btn).on("click", bAction);
			li.appendChild(btn);
			return li;
		}
		function createSaveList() {
			function createButton(bId, bClass, bText, bSlot, bAction) {
				var btn = document.createElement("button");
				btn.id = "saves-" + bId + "-" + bSlot;
				if (bClass) {
					btn.className = bClass;
				}
				btn.classList.add(bId);
				btn.innerHTML = bText;
				jQuery(btn).on("click", function (i) {
					return function () { bAction(i); };
				}(bSlot));
				return btn;
			}

			var saves = storage.getItem("saves");
			if (saves === null) { return false; }

			var	tbody  = document.createElement("tbody"),
				tr,
				tdSlot,
				tdLoad,
				tdDesc,
				tdDele;
			var	tdLoadBtn, tdDescTxt, tdDeleBtn;

			if (SaveSystem.autosaveOK()) {
				tr     = document.createElement("tr"),
				tdSlot = document.createElement("td"),
				tdLoad = document.createElement("td"),
				tdDesc = document.createElement("td"),
				tdDele = document.createElement("td");

				//tdSlot.appendChild(document.createTextNode("\u25c6"));
				tdDescTxt = document.createElement("b");
				tdDescTxt.innerHTML = "A";
				tdSlot.appendChild(tdDescTxt);

				if (saves.autosave && saves.autosave.state.mode === config.historyMode) {
					tdLoadBtn = document.createElement("button");
					tdLoadBtn.id = "saves-load-autosave";
					tdLoadBtn.classList.add("load");
					tdLoadBtn.classList.add("ui-close");
					tdLoadBtn.innerHTML = "Load";
					jQuery(tdLoadBtn).on("click", SaveSystem.loadAuto);
					tdLoad.appendChild(tdLoadBtn);

					tdDescTxt = document.createTextNode(saves.autosave.title);
					tdDesc.appendChild(tdDescTxt);
					tdDesc.appendChild(document.createElement("br"));
					tdDescTxt = document.createElement("small");
					tdDescTxt.innerHTML = "Autosaved (" + new Date(saves.autosave.date).toLocaleString() + ")";
					tdDesc.appendChild(tdDescTxt);

					tdDeleBtn = document.createElement("button");
					tdDeleBtn.id = "saves-delete-autosave";
					tdDeleBtn.classList.add("delete");
					tdDeleBtn.innerHTML = "Delete";
					jQuery(tdDeleBtn).on("click", function () {
						SaveSystem.deleteAuto();
						buildDialogSaves(); // rebuild the saves menu
					});
					tdDele.appendChild(tdDeleBtn);
				} else {
					tdDescTxt = document.createElement("i");
					tdDescTxt.innerHTML = "(autosave slot empty)";
					tdDesc.appendChild(tdDescTxt);
					tdDesc.classList.add("empty");
				}

				tr.appendChild(tdSlot);
				tr.appendChild(tdLoad);
				tr.appendChild(tdDesc);
				tr.appendChild(tdDele);
				tbody.appendChild(tr);
			}
			for (var i = 0; i < saves.slots.length; i++) {
				tr     = document.createElement("tr"),
				tdSlot = document.createElement("td"),
				tdLoad = document.createElement("td"),
				tdDesc = document.createElement("td"),
				tdDele = document.createElement("td");

				tdSlot.appendChild(document.createTextNode(i+1));

				if (saves.slots[i] && saves.slots[i].state.mode === config.historyMode) {
					tdLoadBtn = createButton("load", "ui-close", "Load", i, SaveSystem.load);
					tdLoad.appendChild(tdLoadBtn);

					tdDescTxt = document.createTextNode(saves.slots[i].title);
					tdDesc.appendChild(tdDescTxt);
					tdDesc.appendChild(document.createElement("br"));
					tdDescTxt = document.createElement("small");
					if (saves.slots[i].date) {
						tdDescTxt.innerHTML = "Saved (" + new Date(saves.slots[i].date).toLocaleString() + ")";
					} else {
						tdDescTxt.innerHTML = "Saved (<i>unknown</i>)";
					}
					tdDesc.appendChild(tdDescTxt);

					tdDeleBtn = createButton("delete", null, "Delete", i, function (i) {
						SaveSystem.delete(i);
						buildDialogSaves(); // rebuild the saves menu
					});
					tdDele.appendChild(tdDeleBtn);
				} else {
					tdLoadBtn = createButton("save", "ui-close", "Save", i, SaveSystem.save);
					tdLoad.appendChild(tdLoadBtn);

					tdDescTxt = document.createElement("i");
					tdDescTxt.innerHTML = "(save slot empty)";
					tdDesc.appendChild(tdDescTxt);
					tdDesc.classList.add("empty");
				}

				tr.appendChild(tdSlot);
				tr.appendChild(tdLoad);
				tr.appendChild(tdDesc);
				tr.appendChild(tdDele);
				tbody.appendChild(tr);
			}
			var table = document.createElement("table");
			table.id = "saves-list";
			table.appendChild(tbody);
			return table;
		}
		function createSavesImport() {
			var	el    = document.createElement("div"),
				label = document.createElement("div"),
				input = document.createElement("input");

			// add label
			label.id = "saves-import-label";
			label.appendChild(document.createTextNode("Select a save file to load:"));
			el.appendChild(label);

			// add file input
			input.type = "file";
			input.id   = "saves-import-file";
			input.name = "saves-import-file";
			jQuery(input).on("change", function (evt) {
				SaveSystem.importSave(evt);
				uiClose();
			});
			el.appendChild(input);

			return el;
		}

		if (DEBUG) { console.log("[UISystem.buildDialogSaves()]"); }

		var	savesOK = SaveSystem.OK(),
			list,
			btnBar;

		jQuery(_body)
			.empty()
			.removeClass()
			.addClass("saves");

		if (savesOK) {
			// add saves list
			list = createSaveList();
			if (!list) {
				list = document.createElement("div");
				list.id = "saves-list"
				list.innerHTML = "<i>No save slots found</i>";
			}
			_body.appendChild(list);
		}

		// add action list (export, import, and purge) and import input
		if (savesOK || has.fileAPI) {
			btnBar = document.createElement("div");
			list = document.createElement("ul");
			if (has.fileAPI) {
				list.appendChild(createActionItem("export", "ui-close", "Save to Disk\u2026", SaveSystem.exportSave));
				list.appendChild(createActionItem("import", null, "Load from Disk\u2026", function (evt) {
					if (!document.getElementById("saves-import-file")) {
						_body.appendChild(createSavesImport());
					}
				}));
			}
			if (savesOK) {
				list.appendChild(createActionItem("purge", null, "Purge Slots", function (evt) {
					SaveSystem.purge();
					buildDialogSaves(); // rebuild the saves menu
				}));
			}
			btnBar.appendChild(list);
			_body.appendChild(btnBar);
			return true;
		} else {
			dialogAlert("Apologies! Your browser either lacks some of the capabilities required to support saves or has disabled them.\n\nThe former may be solved by updating it to a newer version or by switching to a more modern browser.\n\nThe latter may be solved by loosening its security restrictions or, perhaps, by viewing the " + strings.identity + " via the HTTP protocol.");
			return false;
		}
	}

	function buildDialogRewind() {
		if (DEBUG) { console.log("[UISystem.buildDialogRewind()]"); }

		var list = document.createElement("ul");

		jQuery(_body)
			.empty()
			.removeClass()
			.addClass("dialog-list rewind")
			.append(list);

		for (var i = 0, iend = state.length - 1; i < iend; i++) {
			var passage = tale.get(state.history[i].title);
			if (passage && passage.tags.contains("bookmark")) {
				var	item = document.createElement("li"),
					link = document.createElement("a");
				link.classList.add("ui-close");
				jQuery(link).on("click", function () {
					var p = i;
					if (config.historyMode === History.Modes.Session) {
						return function () {
							if (DEBUG) { console.log("[rewind:click() @Session]"); }

							// necessary?
							document.title = tale.title;

							// regenerate the state history suid
							state.regenerateSuid();

							// push the history states in order
							if (config.disableHistoryControls) {
								if (DEBUG) { console.log("    > pushing: " + p + " (" + state.history[p].title + ")"); }

								// load the state into the window history
								History.replaceWindowState(
									{ suid : state.suid, sidx : state.history[p].sidx },
									(config.displayPassageTitles && state.history[p].title !== config.startPassage)
										? tale.title + ": " + state.history[p].title
										: tale.title
								);
							} else {
								for (var i = 0, end = p; i <= end; i++) {
									if (DEBUG) { console.log("    > pushing: " + i + " (" + state.history[i].title + ")"); }

									// load the state into the window history
									History.addWindowState(
										{ suid : state.suid, sidx : state.history[i].sidx },
										(config.displayPassageTitles && state.history[i].title !== config.startPassage)
											? tale.title + ": " + state.history[i].title
											: tale.title
									);
								}
							}

							var windowState = History.getWindowState();
							if (windowState !== null && windowState.sidx < state.top.sidx) {
								if (DEBUG) { console.log("    > stacks out of sync; popping " + (state.top.sidx - windowState.sidx) + " states to equalize"); }
								// stack indexes are out of sync, pop our stack until
								// we're back in sync with the window.history
								state.pop(state.top.sidx - windowState.sidx);
							}

							// activate the current top
							state.setActiveState(state.top);

							// display the passage
							state.display(state.active.title, null, "replace");
						};
					} else if (config.historyMode === History.Modes.Window) {
						return function () {
							if (DEBUG) { console.log("[rewind:click() @Window]"); }

							// necessary?
							document.title = tale.title;

							// push the history states in order
							if (!config.disableHistoryControls) {
								for (var i = 0, end = p; i <= end; i++) {
									if (DEBUG) { console.log("    > pushing: " + i + " (" + state.history[i].title + ")"); }

									// load the state into the window history
									var stateObj = { history : state.history.slice(0, i + 1) };
									if (state.hasOwnProperty("prng")) {
										stateObj.rseed = state.prng.seed;
									}
									History.addWindowState(
										stateObj,
										(config.displayPassageTitles && state.history[i].title !== config.startPassage)
											? tale.title + ": " + state.history[i].title
											: tale.title
									);
								}
							}

							// stack ids are out of sync, pop our stack until
							// we're back in sync with the window.history
							state.pop(state.length - (p + 1));

							// activate the current top
							state.setActiveState(state.top);

							// display the passage
							state.display(state.active.title, null, "replace");
						};
					} else { // History.Modes.Hash
						return function () {
							if (DEBUG) { console.log("[rewind:click() @Hash]"); }

							if (!config.disableHistoryControls) {
								window.location.hash = state.history[p].hash;
							} else {
								session.setItem("activeHash", state.history[p].hash);
								window.location.reload();
							}
						};
					}
				}());
				link.appendChild(document.createTextNode("Turn " + (i + 1) + ": " + passage.description()));
				item.appendChild(link);
				list.appendChild(item);
			}
		}
		if (!list.hasChildNodes()) {
			var	item = document.createElement("li"),
				link = document.createElement("a");
			link.innerHTML = "<i>No rewind points available\u2026</i>";
			item.appendChild(link);
			list.appendChild(item);
		}
	}

	function buildDialogRestart() {
		if (DEBUG) { console.log("[UISystem.buildDialogRestart()]"); }

		jQuery(_body)
			.empty()
			.removeClass()
			.addClass("dialog restart")
			.append('<p>Are you sure that you want to restart?  Unsaved progress will be lost.</p><ul class="buttons">'
				+ '<li><button id="restart-ok" class="ui-close">OK</button></li>'
				+ '<li><button id="restart-cancel" class="ui-close">Cancel</button></li>'
				+ '</ul>');

		// add an additional click handler for the OK button
		jQuery("#ui-body #restart-ok").one("click", function () {
			state.restart();
		});

		return true;
	}

	function buildDialogOptions() {
		if (DEBUG) { console.log("[UISystem.buildDialogOptions()]"); }

		jQuery(_body)
			.empty()
			.removeClass()
			.addClass("dialog options");
		new Wikifier(_body, tale.get("MenuOptions").processText().trim());

		return true;
	}

	function buildDialogShare() {
		if (DEBUG) { console.log("[UISystem.buildDialogShare()]"); }

		jQuery(_body)
			.empty()
			.removeClass()
			.addClass("dialog-list share")
			.append(buildListFromPassage("MenuShare"));
			//.find("a")
			//	.addClass("ui-close");

		return true;
	}

	function buildDialogAutoload() {
		if (DEBUG) { console.log("[UISystem.buildDialogAutoload()]"); }

		jQuery(_body)
			.empty()
			.removeClass()
			.addClass("dialog autoload")
			.append('<p>' + strings.saves.autoloadPrompt + '</p><ul class="buttons">'
				+ '<li><button id="autoload-ok" class="ui-close">' + strings.saves.autoloadPromptOK + '</button></li>'
				+ '<li><button id="autoload-cancel" class="ui-close">' + strings.saves.autoloadPromptCancel + '</button></li>'
				+ '</ul>');

		// add an additional click handler for the #autoload-* buttons
		jQuery(document.body).one("click.autoload", ".ui-close", function (evt) {
			if (DEBUG) { console.log('    > display/autoload: "' + SaveSystem.getAuto().title + '"'); }
			if (evt.target.id !== "autoload-ok" || !SaveSystem.loadAuto()) {
				if (DEBUG) { console.log('    > display: "' + config.startPassage + '"'); }
				state.display(config.startPassage);
			}
		});

		return true;
	}

	function buildListFromPassage(passage, list) {
		if (list == null) { // use lazy equality
			list = document.createElement("ul");
		}
		var temp = document.createDocumentFragment();
		new Wikifier(temp, tale.get(passage).processText().trim());
		if (temp.hasChildNodes()) {
			var li = null;
			while (temp.hasChildNodes()) {
				var node = temp.firstChild;
				if (node.nodeType !== Node.TEXT_NODE && (node.nodeType !== Node.ELEMENT_NODE || node.nodeName.toUpperCase() === "BR")) { // non-text, non-element, or <br>-element nodes
					temp.removeChild(node);
					if (li !== null) {
						// forget the current list item
						li = null;
					}
				} else { // text or non-<br>-element nodes
					if (li === null) {
						// create a new list item
						li = document.createElement("li");
						list.appendChild(li);
					}
					li.appendChild(node);
				}
			}
		}
		return list;
	}


	/*******************************************************************************************************************
	 * Built-ins
	 ******************************************************************************************************************/
	function dialogAlert(message, options, closeFn) {
		jQuery(_body)
			.empty()
			.addClass("dialog alert")
			.append('<p>' + message + '</p><ul class="buttons"><li><button id="alert-ok" class="ui-close">OK</button></li></ul>');
		uiOpen(options, closeFn);
	}

	function dialogRestart(options) {
		buildDialogRestart();
		uiOpen(options);
	}

	function dialogOptions(/* options, closeFn */) {
		buildDialogOptions();
		uiOpen.apply(null, arguments);
	}

	function dialogRewind(/* options, closeFn */) {
		buildDialogRewind();
		uiOpen.apply(null, arguments);
	}

	function dialogSaves(/* options, closeFn */) {
		buildDialogSaves();
		uiOpen.apply(null, arguments);
	}

	function dialogShare(/* options, closeFn */) {
		buildDialogShare();
		uiOpen.apply(null, arguments);
	}


	/*******************************************************************************************************************
	 * Core
	 ******************************************************************************************************************/
	function uiIsOpen(classNames) {
		return document.documentElement.classList.contains("ui-open")
			&& (!classNames ? true : _body.classList.contains(classNames));
	}

	function uiBody() {
		return _body;
	}

	function uiSetup(classNames) {
		jQuery(_body)
			.empty()
			.removeClass()
			.addClass("dialog");
		if (classNames != null) { // use lazy equality
			jQuery(_body).addClass(classNames);
		}
		return _body;
	}

	function uiAddClickHandler(target, options, startFn, doneFn, closeFn) {
		jQuery(target).on("click", function (evt) {
			evt.preventDefault(); // does not prevent bound events, only default actions (e.g. href links)

			// call the start function
			if (typeof startFn === "function") {
				startFn(evt);
			}

			// open the dialog
			uiOpen(options, closeFn);

			// call the done function
			if (typeof doneFn === "function") {
				doneFn(evt);
			}
		});
	}

	function uiOpen(options, closeFn) {
		options = jQuery.extend({ top : 50, opacity : 0.8 }, options);

		// stop the body from scrolling and setup the delegated UI close handler
		jQuery(document.body)
			.on("click.uisystem-close", ".ui-close", closeFn, uiClose);

		// display the overlay
		jQuery(_overlay)
			.css({ display : "block", opacity : 0 })
			.fadeTo(200, options.opacity);

		// add the dialog imagesLoaded handler, if requested
		if (options.resizeOnImagesLoaded) {
			jQuery(_body)
				.imagesLoaded()
				.always((function (top) {
					return function () {
						uiResizeHandler({ data : top });
					};
				}(options.top)));
		}

		// display the dialog
		var position = uiCalcPosition(options.top);
		jQuery(_body)
			.css(jQuery.extend({ display : "block", opacity : 0 }, position.dialog))
			.fadeTo(200, 1);
		jQuery(_closer)
			.css(jQuery.extend({ display : "block", opacity : 0 }, position.closer))
			.fadeTo(50, 1);

		// add the UI isOpen class
		jQuery(document.documentElement)
			.addClass("ui-open");

		// add the UI resize handler
		jQuery(window)
			.on("resize.uisystem", null, options.top, jQuery.debounce(40, uiResizeHandler));
	}

	function uiClose(evt) {
		// pretty much reverse the actions taken in uiOpen()
		jQuery(window)
			.off("resize.uisystem");
		jQuery(document.documentElement)
			.removeClass("ui-open");
		jQuery(_body)
			.css({
				display : "none",
				opacity : 0,
				left    : "",
				right   : "",
				top     : "",
				bottom  : ""
			})
			.removeClass()
			.empty(); // .empty() here will break static menus
		jQuery(_closer)
			.css({
				display : "none",
				opacity : 0,
				right   : "",
				top     : ""
			});
		/*
		jQuery(_overlay)
			.css({
				display : "none",
				opacity : 0
			})
			.fadeOut(200);
		*/
		jQuery(_overlay)
			.fadeOut(200);
		jQuery(document.body)
			.off("click.uisystem-close");

		// call the given "on close" callback function, if any
		if (evt && typeof evt.data === "function") {
			evt.data(evt);
		}
	}

	function uiResizeHandler(evt) {
		var	$dialog = jQuery(_body),
			$closer = jQuery(_closer),
			topPos  = (evt && typeof evt.data !== "undefined") ? evt.data : 50;

		if ($dialog.css("display") === "block") {
			// stow the dialog and unset its positional properties (this is important!)
			$dialog.css({ display : "none", left : "", right : "", top : "", bottom : "" });
			$closer.css({ display : "none", right : "", top : "" });

			// restore the dialog with its new positional properties
			var position = uiCalcPosition(topPos);
			$dialog.css(jQuery.extend({ display : "block" }, position.dialog));
			$closer.css(jQuery.extend({ display : "block" }, position.closer));
		}
	}

	function uiCalcPosition(topPos) {
		if (typeof topPos === "undefined") {
			topPos = 50;
		}

		var	$parent   = jQuery(window),
			$dialog   = jQuery(_body),
			dialogPos = { left : "", right : "", top : "", bottom : "" },
			$closer   = jQuery(_closer),
			closerPos = { right : "", top : "" },
			horzSpace = $parent.width() - $dialog.outerWidth(true),
			vertSpace = $parent.height() - $dialog.outerHeight(true);

		if (horzSpace <= 32) {
			dialogPos.left = dialogPos.right = 16;
		} else {
			dialogPos.left = dialogPos.right = ~~(horzSpace / 2);
		}
		if (vertSpace <= 32) {
			dialogPos.top = dialogPos.bottom = 16;
		} else {
			if ((vertSpace / 2) > topPos) {
				dialogPos.top = topPos;
			} else {
				dialogPos.top = dialogPos.bottom = ~~(vertSpace / 2);
			}
		}

		closerPos.right = (dialogPos.right - $closer.outerWidth(true) + 6) + "px";
		closerPos.top = (dialogPos.top - $closer.outerHeight(true) + 6) + "px";
		Object.keys(dialogPos).forEach(function (p) {
			if (dialogPos[p] !== "") {
				dialogPos[p] += "px";
			}
		});

		return { dialog : dialogPos, closer : closerPos };
	}


	/*******************************************************************************************************************
	 * Exports
	 ******************************************************************************************************************/
	return Object.defineProperties({}, {
		// Initialization
		init                 : { value : init },
		// Internals
		start                : { value : start },
		setPageElements      : { value : setPageElements },
		buildDialogSaves     : { value : buildDialogSaves },
		buildDialogRewind    : { value : buildDialogRewind },
		buildDialogRestart   : { value : buildDialogRestart },
		buildDialogOptions   : { value : buildDialogOptions },
		buildDialogShare     : { value : buildDialogShare },
		buildDialogAutoload  : { value : buildDialogAutoload },
		buildListFromPassage : { value : buildListFromPassage },
		// Built-ins
		alert                : { value : dialogAlert },
		restart              : { value : dialogRestart },
		options              : { value : dialogOptions },
		rewind               : { value : dialogRewind },
		saves                : { value : dialogSaves },
		share                : { value : dialogShare },
		// Core
		isOpen               : { value : uiIsOpen },
		body                 : { value : uiBody },
		setup                : { value : uiSetup },
		addClickHandler      : { value : uiAddClickHandler },
		open                 : { value : uiOpen },
		close                : { value : uiClose },
		// DEPRECATED
		show                 : { value : uiOpen }
	});

}());

