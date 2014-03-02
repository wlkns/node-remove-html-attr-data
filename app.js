var fs = require('fs'),
	util = require('util');
	ini = require('ini'),
	output = require('color-terminal'),
	dir = require('node-dir'),
	config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));


if ( process.argv.length < 3 )
{
	console.log("Usage: node app.js <path or project>");
	process.exit();
}

var directory = process.argv[2];
if ( config.hasOwnProperty("projects") && config.projects.hasOwnProperty(directory) )
{
	directory = config.projects[directory];
}

if ( !fs.existsSync(directory) ) {
	console.log("Error: Unable to find directory: " + directory);
	process.exit();
}

function parse( data ) {
	for( var attr in config ) {
		var replaces = config[attr];

		if ( attr == 'projects' || typeof replaces != 'object' )
			continue;

		var attrs_found = data.match(new RegExp(" " + attr+"=['\"]+([^'\"]+)['\"]+", "ig")),
			attrs_replaced = [];

		for ( var i in attrs_found )
		{
			contents = attrs_found[i].substring(attr.length + 3, attrs_found[i].length - 1);
			for ( var needle in replaces )
			{
				var replacement = replaces[needle] || '';
				needle = needle.replace('*', "[A-Z0-9-_]+");
				contents = contents.replace(new RegExp("(^| )" + needle + "( |$)", "ig"), "$1" + replacement + "$2");
			}

			contents = contents.replace(new RegExp("[ ]+", "ig"), " ").trim();
			attrs_replaced[i] = contents.length ? " "+attr+'="' + contents + '"' : '';
			if ( attrs_replaced[i] != attrs_found[i] )
			{
				data = data.replace(attrs_found[i], attrs_replaced[i]);
				if ( !attrs_replaced[i].length ) attrs_replaced[i] = '%rEMPTY';
				output.colorize("Replaced %c" + attrs_found[i].trim() + "%n with %g" + attrs_replaced[i].trim() + "%N\n");
			}
		}
	}

	return data;
}

output.colorize('%mmomo-fixer%N version 1.0 by Jak Wilkins.\n');
output.colorize('Starting on: %b' + directory + '%n\n');

dir.readFiles(directory, {
	match: /.html$/,
	exclude: /^\./,
	excludeDir: /Build/,
}, found, finish);

function found(err, content, filename, next) {
	if (err) throw err;
	output.colorize('\nProcessing %m'+filename.substring(directory.length)+'%n\n');
	var newcontent = parse(content);
	if ( newcontent.length == content.length )
	{
		output.colorize('No changes detected. %rSkipped%n.\n');
	}
	else
	{
		output.colorize('Writing new changes.');
		fs.writeFileSync(filename, newcontent);
		output.colorize('%gFinished%n.\n');
	}
	next();
}

function finish(err, files) {
	if (err) throw err;
	output.colorize('\n%gFinished%n reading %b' + files.length + '%N files.\n\n');
}