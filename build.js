#!/usr/bin/env node
/*
	build.js
	  - Description : Node.js-hosted build script for SugarCube 1.x
	  - Author      : Thomas Michael Edwards <thomasmedwards@gmail.com>
	  - Copyright   : Copyright © 2014–2015 Thomas Michael Edwards. All rights reserved.
	  - Version     : 1.2.6, 2015-05-01
*/
"use strict";

/*******************************************************************************
 * CONFIGURATION
 ******************************************************************************/
var CONFIG = {
	js : [
		// the ordering here is significant
		"src/intro.js",
		"src/intrinsics.js",
		"src/capabilities.js",
		"src/strings.js",
		"src/utility.js",
		"src/keyvaluestore.js",
		"src/savesystem.js",
		"src/uisystem.js",
		"src/story.js",
		"src/wikifier.js",
		"src/macros.js",
		"src/macroslib.js",
		"src/userlib.js",
		"src/main.js",
		"src/outro.js"
	],
	css : [
		// the ordering here is significant
		"src/init-screen.css",
		"src/fonts.css",
		"src/structural.css",
		"src/appearance.css",
		"src/media-queries.css",
		"src/media-queries-narrow.css"
	],
	twine1 : {
		build : {
			src  : "src/format-twine1.tpl",
			dest : "dist/twine1/sugarcube/header.html"
		},
		copy : [
			{
				src  : "src/format-twine1.py",
				dest : "dist/twine1/sugarcube/sugarcube.py"
			},
			{
				src  : "LICENSE",
				dest : "dist/twine1/sugarcube/LICENSE"
			}
		]
	},
	twine2 : {
		build : {
				src  : "src/format-twine2.tpl",
				dest : "dist/twine2/SugarCube-1/format.js",
				json : "src/format-twine2.json"
		},
		copy : [
			{
				src  : "icon.svg",
				dest : "dist/twine2/SugarCube-1/icon.svg"
			},
			{
				src  : "LICENSE",
				dest : "dist/twine2/SugarCube-1/LICENSE"
			}
		]
	}
};


/*******************************************************************************
 * UTILITY FUNCTIONS
 ******************************************************************************/
function log(message) {
	console.log("%s%s", _indent, message);
}

function warn(message) {
	console.warn("%swarning: %s", _indent, message);
}

function die(message, error) {
	if (error) {
		console.error("error: %s\n[@: %d/%d] Trace:\n", message, error.line, error.col, error.stack);
	} else {
		console.error("error: %s", message);
	}
	process.exit(1);
}

function makePath(pathname) {
	var pathBits = _path.normalize(pathname).split(_path.sep);
	for (var i = 0; i < pathBits.length; i++) {
		var dirPath = i === 0 ? pathBits[i] : pathBits.slice(0, i+1).join(_path.sep);
		if (!_fs.existsSync(dirPath)) {
			_fs.mkdirSync(dirPath);
		}
	}
}

function copyFile(src, dest) {
	var buf;
	try {
		buf = _fs.readFileSync(src);
	} catch (e) {
		die('cannot open file "' + src + '" for reading (reason: ' + e.message + ')');
	}
	try {
		_fs.writeFileSync(dest, buf);
	} catch (e) {
		die('cannot open file "' + dest + '" for writing (reason: ' + e.message + ')');
	}
	return true;
}

function readFileContents(filename) {
	try {
		// the replace() is necessary because Node.js only offers binary mode file
		// access, regardless of platform, so we convert DOS-style line terminators
		// to UNIX-style, just in case someone adds/edits a file and gets DOS-style
		// line termination all over it
		return _fs.readFileSync(filename, { encoding: "utf8" }).replace(/\r\n/g, "\n");
	} catch (e) {
		die('cannot open file "' + filename + '" for reading (reason: ' + e.message + ')');
	}
}

function writeFileContents(filename, data) {
	try {
		_fs.writeFileSync(filename, data, { encoding: "utf8" });
	} catch (e) {
		die('cannot open file "' + filename + '" for writing (reason: ' + e.message + ')');
	}
}

function concatFiles(filenames, callback) {
	var output = filenames.map(function (filename) {
			var contents = readFileContents(_path.normalize(filename));
			return (typeof callback === "function") ? callback(filename, contents) : contents;
		});
	return output.join("\n"); // we only use UNIX-style line termination
}

function compileJavaScript(filenames, options) {
	log('compiling JavaScript...');
	var jsSource = concatFiles(filenames);
	if (_opt.options.unminified) {
		return [
			"window.TWINE1=" + (!!options.twine1),
			"window.DEBUG=" + (_opt.options.debug || false)
		].join(";\n") + ";\n" + jsSource;
	} else {
		try {
			var	uglifyjs = require("uglify-js"),
				result   = uglifyjs.minify(jsSource, {
					fromString : true,
					compress : {
						global_defs : {
							TWINE1 : (!!options.twine1),
							DEBUG  : (_opt.options.debug || false)
						},
						screw_ie8 : true
					},
					mangle : {
						except    : [ "thisp" ],
						screw_ie8 : true
					},
					output : {
						screw_ie8 : true
					}
				});
			return result.code;
		} catch (e) {
			var mesg = "uglification error";
			if (e.line > 0) {
				var begin = (e.line > 4 ) ? e.line - 4 : 0,
					end   = (e.line + 3 < jsSource.length) ? e.line + 3 : jsSource.length;
				mesg += ":\n >> " + jsSource.split(/\n/).slice(begin, end).join("\n >> ");
			}
			die(mesg, e);
		}
	}
}

function compileStyles(filenames) {
	log('compiling CSS...');
	var CleanCSS = require('clean-css');
	return concatFiles(filenames, function (filename, contents) {
		// at present, the CSS is returned unminified
		var minified = new CleanCSS({ advanced : false }).minify(contents).styles;
		return '<style id="style-' + _path.basename(filename, ".css").toLowerCase().replace(/[^a-z0-9]+/g, "-")
			+ '" type="text/css">' + minified + '</style>';
	});
}

function projectBuild(project) {
	var	infile  = _path.normalize(project.build.src),
		outfile = _path.normalize(project.build.dest),
		output  = readFileContents(infile); // load the header template
	log('building: "' + outfile + '"');

	// process the source replacement tokens (first!)
	//   n.b. we use the replacement function style here to disable the special replacement patterns, since some
	//        of them (notably "$&") exist within the replacement strings (specifically, within appSource)
	output = output.replace('"{{BUILD_APP_SOURCE}}"', function () { return project.appSource; });
	output = output.replace('"{{BUILD_CSS_SOURCE}}"', function () { return project.cssSource; });

	// process the build replacement tokens
	output = output.replace(/\"\{\{BUILD_VERSION_MAJOR\}\}\"/g, project.version.major);
	output = output.replace(/\"\{\{BUILD_VERSION_MINOR\}\}\"/g, project.version.minor);
	output = output.replace(/\"\{\{BUILD_VERSION_PATCH\}\}\"/g, project.version.patch);
	output = output.replace(/\"\{\{BUILD_VERSION_PRERELEASE\}\}\"/g, JSON.stringify(project.version.prerelease));
	output = output.replace(/\"\{\{BUILD_VERSION_BUILD\}\}\"/g, project.version.build);
	output = output.replace(/\"\{\{BUILD_VERSION_DATE\}\}\"/g, JSON.stringify(project.version.date));
	output = output.replace(/\"\{\{BUILD_VERSION_VERSION\}\}\"/g, project.version);

	// post-process hook
	if (typeof project.postProcess === "function") {
		output = project.postProcess.call(project, output);
	}

	// write the outfile
	makePath(_path.dirname(outfile));
	writeFileContents(outfile, output);
}

function projectCopy(fileObjs) {
	fileObjs.forEach(function (file) {
		var	infile  = _path.normalize(file.src),
			outfile = _path.normalize(file.dest);
		log('copying : "' + outfile + '"');

		// copy the file
		makePath(_path.dirname(outfile));
		copyFile(infile, outfile);
	});
}


/*******************************************************************************
 * MAIN SCRIPT
 ******************************************************************************/
var	_fs   = require("fs"),
	_path = require("path"),
	_opt  = require('node-getopt').create([
		['b', 'build=VERSION', 'Build only for Twine major version: 1 or 2; default: build for all.'],
		['d', 'debug',         'Keep debugging code; gated by DEBUG symbol.'],
		['u', 'unminified',    'Suppress minification stages.'],
		['h', 'help',          'Print this help, then exit.']
	])
		.bindHelp()     // bind option 'help' to default action
		.parseSystem(); // parse command line
var	_buildForTwine1 = true,
	_buildForTwine2 = true,
	_indent         = " -> ";

// build selection
if (_opt.options.build) {
	switch (_opt.options.build) {
	case "1":
		_buildForTwine2 = false;
		break;
	case "2":
		_buildForTwine1 = false;
		break;
	default:
		die('unknown Twine major version: ' + _opt.options.build + '; valid values: 1 or 2');
		break;
	}
}

// build the project
(function () {
	console.log('Starting builds...');

	// create the build ID file, if nonexistent
	if (!_fs.existsSync(".build")) {
		writeFileContents(".build", 0);
	}

	// get the base version info and set build metadata
	var version      = require("./src/sugarcube.json"); // "./" prefixing the relative path is important here
	version.build    = +readFileContents(".build") + 1;
	version.date     = (new Date()).toISOString();
	version.toString = function () {
		return this.major + "." + this.minor + "." + this.patch + (this.prerelease ? "-" + this.prerelease : "");
	};

	// build for Twine 1.x
	if (_buildForTwine1 && CONFIG.twine1) {
		console.log('\nBuilding Twine 1.x version:');

		// process the header templates and write the outfiles
		projectBuild({
			build     : CONFIG.twine1.build,
			version   : version,
			appSource : compileJavaScript(CONFIG.js, { twine1 : true }), // combine and minify the JS
			cssSource : compileStyles(CONFIG.css)                        // combine and minify the CSS
		});

		// process the files that simply need copied into the distribution
		projectCopy(CONFIG.twine1.copy);
	}

	// build for Twine 2.x
	if (_buildForTwine2 && CONFIG.twine2) {
		console.log('\nBuilding Twine 2.x version:');

		// process the header templates and write the outfiles
		projectBuild({
			build       : CONFIG.twine2.build,
			version     : version,
			appSource   : compileJavaScript(CONFIG.js, { twine1 : false }), // combine and minify the JS
			cssSource   : compileStyles(CONFIG.css),                        // combine and minify the CSS
			postProcess : function (input) {
				var output = require("./" + _path.normalize(this.build.json)); // "./" prefixing the relative path is important here

				// merge data into the output format
				output.description = output.description.replace(/\"\{\{BUILD_VERSION_MAJOR\}\}\"/g, this.version.major);
				output.version     = this.version.toString();
				output.source      = input;

				// wrap the output in the storyFormat() function
				output = "window.storyFormat(" + JSON.stringify(output) + ");";

				return output;
			}
		});

		// process the files that simply need copied into the distribution
		projectCopy(CONFIG.twine2.copy);
	}

	// update the build ID
	writeFileContents(".build", version.build);
}());

// that's all folks!
console.log('\nBuilds complete!  (check the "dist" directory)');

