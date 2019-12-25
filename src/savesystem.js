/***********************************************************************************************************************
 *
 * savesystem.js
 *
 * Copyright © 2013–2015 Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
 * Use of this source code is governed by a Simplified BSD License which can be found in the LICENSE file.
 *
 **********************************************************************************************************************/

var SaveSystem = (function () {
	"use strict";

	var
		_badStore    = false,
		_slotsUBound = -1;


	/*******************************************************************************************************************
	 * Initialization
	 ******************************************************************************************************************/
	function init() {
		function appendSlots(array, num) {
			for (var i = 0; i < num; i++) {
				array.push(null);
			}
			return array;
		}
		/* legacy kludges */
		function convertOldSave(saveObj) {
			if (saveObj.hasOwnProperty("data") && !saveObj.hasOwnProperty("state")) {
				saveObj.state = {
					mode  : saveObj.mode,
					delta : History.deltaEncodeHistory(saveObj.data)
				};
				delete saveObj.mode;
				delete saveObj.data;
			} else if (saveObj.hasOwnProperty("state") && !saveObj.state.hasOwnProperty("delta")) {
				saveObj.state.delta = History.deltaEncodeHistory(saveObj.state.history);
				delete saveObj.state.history;
			}
		}
		/* /legacy kludges */

		if (DEBUG) { console.log("[SaveSystem.init()]"); }

		if (config.saves.slots < 0) {
			config.saves.slots = 0;
		}

		// create and store the saves object, if it doesn't exist
		if (!storage.hasItem("saves")) {
			storage.setItem("saves", {
				autosave : null,
				slots    : appendSlots([], config.saves.slots)
			});
		}

		// retrieve the saves object
		var saves = storage.getItem("saves");
		if (saves === null) {
			_badStore = true;
			return false;
		}

		/* legacy kludges */
		// convert an old saves array into a new saves object
		if (Array.isArray(saves)) {
			saves = {
				autosave : null,
				slots    : saves
			};
			storage.setItem("saves", saves);
		}
		/* /legacy kludges */

		// handle the author changing the number of save slots
		if (config.saves.slots !== saves.slots.length) {
			if (config.saves.slots < saves.slots.length) {
				// attempt to decrease the number of slots; this will only compact
				// the slots array, by removing empty slots, no saves will be deleted
				saves.slots.reverse();
				saves.slots = saves.slots.filter(function (val) {
					if (val === null && this.count > 0) {
						this.count--;
						return false;
					}
					return true;
				}, { count : saves.slots.length - config.saves.slots });
				saves.slots.reverse();
			} else if (config.saves.slots > saves.slots.length) {
				// attempt to increase the number of slots
				appendSlots(saves.slots, config.saves.slots - saves.slots.length);
			}
			storage.setItem("saves", saves);
		}

		/* legacy kludges */
		// convert old-style saves
		var needSave = false;
		if (saves.autosave !== null) {
			if (!saves.autosave.hasOwnProperty("state") || !saves.autosave.state.hasOwnProperty("delta")) {
				convertOldSave(saves.autosave);
				needSave = true;
			}
		}
		for (var i = 0; i < saves.slots.length; i++) {
			if (saves.slots[i] !== null) {
				if (!saves.slots[i].hasOwnProperty("state") || !saves.slots[i].state.hasOwnProperty("delta")) {
					convertOldSave(saves.slots[i]);
					needSave = true;
				}
			}
		}
		if (needSave) { storage.setItem("saves", saves); }
		/* /legacy kludges */

		_slotsUBound = saves.slots.length - 1;

		return true;
	}


	/*******************************************************************************************************************
	 * General
	 ******************************************************************************************************************/
	function OK() {
		return autosaveOK() || slotsOK();
	}

	function purge() {
		storage.removeItem("saves");
		return init();
	}


	/*******************************************************************************************************************
	 * Autosave
	 ******************************************************************************************************************/
	function autosaveOK() {
		return !_badStore && typeof config.saves.autosave !== "undefined";
	}

	function hasAuto() {
		var saves = storage.getItem("saves");
		if (saves === null || saves.autosave === null) {
			return false;
		}
		return true;
	}

	function getAuto() {
		var saves = storage.getItem("saves");
		if (saves === null) {
			return null;
		}
		return saves.autosave;
	}

	function loadAuto() {
		var saves = storage.getItem("saves");
		if (saves === null || saves.autosave === null) {
			return false;
		}
		return unmarshal(saves.autosave);
	}

	function saveAuto(title, metadata) {
		if (typeof config.saves.isAllowed === "function" && !config.saves.isAllowed()) {
			return false;
		}

		var saves = storage.getItem("saves");
		if (saves === null) {
			return false;
		}
		saves.autosave = marshal();
		saves.autosave.title = title || tale.get(state.active.title).description();
		saves.autosave.date = Date.now();
		if (metadata != null) { // use lazy equality
			saves.autosave.metadata = metadata;
		}
		return storage.setItem("saves", saves);
	}

	function deleteAuto() {
		var saves = storage.getItem("saves");
		if (saves === null) {
			return false;
		}
		saves.autosave = null;
		return storage.setItem("saves", saves);
	}


	/*******************************************************************************************************************
	 * Slots
	 ******************************************************************************************************************/
	function slotsOK() {
		return !_badStore && _slotsUBound !== -1;
	}

	function slotsLength() {
		return _slotsUBound + 1;
	}

	function slotsCount() {
		if (!slotsOK()) {
			return 0;
		}

		var saves = storage.getItem("saves");
		if (saves === null) {
			return 0;
		}
		var count = 0;
		for (var i = 0; i < saves.slots.length; i++) {
			if (saves.slots[i] !== null) {
				count++;
			}
		}
		return count;
	}

	function slotsIsEmpty() {
		return slotsCount() === 0;
	}

	function hasSlot(slot) {
		if (slot < 0 || slot > _slotsUBound) {
			return false;
		}

		var saves = storage.getItem("saves");
		if (saves === null || slot >= saves.slots.length || saves.slots[slot] === null) {
			return false;
		}
		return true;
	}

	function getSlot(slot) {
		if (slot < 0 || slot > _slotsUBound) {
			return null;
		}

		var saves = storage.getItem("saves");
		if (saves === null || slot >= saves.slots.length) {
			return null;
		}
		return saves.slots[slot];
	}

	function loadSlot(slot) {
		if (slot < 0 || slot > _slotsUBound) {
			return false;
		}

		var saves = storage.getItem("saves");
		if (saves === null || slot >= saves.slots.length || saves.slots[slot] === null) {
			return false;
		}
		return unmarshal(saves.slots[slot]);
	}

	function saveSlot(slot, title, metadata) {
		if (typeof config.saves.isAllowed === "function" && !config.saves.isAllowed()) {
			UISystem.alert(strings.saves.disallowed);
			return false;
		}
		if (slot < 0 || slot > _slotsUBound) {
			return false;
		}

		var saves = storage.getItem("saves");
		if (saves === null || slot >= saves.slots.length) {
			return false;
		}
		saves.slots[slot] = marshal();
		saves.slots[slot].title = title || tale.get(state.active.title).description();
		saves.slots[slot].date = Date.now();
		if (metadata != null) { // use lazy equality
			saves.slots[slot].metadata = metadata;
		}
		return storage.setItem("saves", saves);
	}

	function deleteSlot(slot) {
		if (slot < 0 || slot > _slotsUBound) {
			return false;
		}

		var saves = storage.getItem("saves");
		if (saves === null || slot >= saves.slots.length) {
			return false;
		}
		saves.slots[slot] = null;
		return storage.setItem("saves", saves);
	}


	/*******************************************************************************************************************
	 * Filesystem
	 ******************************************************************************************************************/
	function exportSave() {
		if (DEBUG) { console.log("[SaveSystem.exportSave()]"); }

		if (typeof config.saves.isAllowed === "function" && !config.saves.isAllowed()) {
			UISystem.alert(strings.saves.disallowed);
			return;
		}

		var	saveName = tale.domId + ".save",
			saveObj  = LZString.compressToBase64(JSON.stringify(marshal()));

		saveAs(new Blob([saveObj], { type : "text/plain;charset=UTF-8" }), saveName);
	}

	function importSave(event) {
		if (DEBUG) { console.log("[SaveSystem.importSave()]"); }

		var	file   = event.target.files[0],
			reader = new FileReader();

		// capture the file information once the load is finished
		jQuery(reader).on("load", function (file) {
			return function (evt) {
				if (DEBUG) { console.log('    > loaded: ' + escape(file.name) + '; payload: ' + evt.target.result); }

				if (!evt.target.result) {
					return;
				}

				var saveObj;
				try {
					saveObj = JSON.parse((/\.json$/i.test(file.name) || /^\{/.test(evt.target.result))
						? evt.target.result
						: LZString.decompressFromBase64(evt.target.result));
				} catch (e) { /* noop, unmarshal() will handle the error */ }
				unmarshal(saveObj);
			};
		}(file));

		// initiate the file load
		reader.readAsText(file);
	}


	/*******************************************************************************************************************
	 * Private
	 ******************************************************************************************************************/
	function marshal() {
		if (DEBUG) { console.log("[SaveSystem.marshal()]"); }

		var saveObj = {
			id    : config.saves.id,
			state : History.marshalToSave()
		};
		if (config.saves.version) {
			saveObj.version = config.saves.version;
		}

		if (typeof config.saves.onSave === "function") {
			config.saves.onSave(saveObj);
		}

		// delta encode the state history
		saveObj.state.delta = History.deltaEncodeHistory(saveObj.state.history);
		delete saveObj.state.history;

		return saveObj;
	}

	function unmarshal(saveObj) {
		if (DEBUG) { console.log("[SaveSystem.unmarshal()]"); }

		try {
			if (!saveObj || !saveObj.hasOwnProperty("id") || !saveObj.hasOwnProperty("state")) {
				if (!saveObj || !saveObj.hasOwnProperty("mode") || !saveObj.hasOwnProperty("id") || !saveObj.hasOwnProperty("data")) {
					throw new Error("save is missing required data; either you've loaded a file which isn't a save, or the save has become corrupted");
				} else {
					throw new Error("old-style saves seen during unmarshal");
				}
			}

			// delta decode the state history
			saveObj.state.history = History.deltaDecodeHistory(saveObj.state.delta);
			delete saveObj.state.delta;

			if (typeof config.saves.onLoad === "function") {
				config.saves.onLoad(saveObj);
			}

			if (saveObj.id !== config.saves.id) {
				throw new Error("save is from the wrong " + strings.identity);
			}

			// restore the state
			History.unmarshalFromSave(saveObj.state);
		} catch (e) {
			UISystem.alert(e.message[0].toUpperCase() + e.message.slice(1) + ".\n\nAborting load.");
			return false;
		}

		return true;
	}


	/*******************************************************************************************************************
	 * Exports
	 ******************************************************************************************************************/
	return Object.defineProperties({}, {
		// Initialization
		init       : { value : init },
		// General
		OK         : { value : OK },
		purge      : { value : purge },
		// Autosave
		autosaveOK : { value : autosaveOK },
		hasAuto    : { value : hasAuto },
		getAuto    : { value : getAuto },
		loadAuto   : { value : loadAuto },
		saveAuto   : { value : saveAuto },
		deleteAuto : { value : deleteAuto },
		// Slots
		slotsOK    : { value : slotsOK },
		length     : { value : slotsLength },
		isEmpty    : { value : slotsIsEmpty },
		count      : { value : slotsCount },
		has        : { value : hasSlot },
		get        : { value : getSlot },
		load       : { value : loadSlot },
		save       : { value : saveSlot },
		delete     : { value : deleteSlot },
		// Filesystem
		exportSave : { value : exportSave },
		importSave : { value : importSave }
	});

}());

