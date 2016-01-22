//replace /SourceCode/bower_components/phonic-build-tasks/seo.js

var system = require('system'),
		page = require('webpage').create(),
		fs = require('fs'),
		config = require('../../config'),
		env, host, body, fileName, text, ready, t, c, i= 0, path;

fs.write('./phantom-log.txt','\n\nphantomjs', 'a');

if (system.args[1] === 'stage') {
	page.settings.userName = 'ogilvy';
	page.settings.password = 'd1g1t@l';
	env = 'stage';
}
else {
	env = 'prod';
}

if (system.args[2] && system.args[2].length > 0) {
	fileName = system.args[2];
	path = system.args[2] === '/' ? '' : '/' + system.args[2];
}
else {
	console.log('[phantomjs log]' + ' ' + 'No path supplied!');
	phantom.exit();
}

host = config.siteUrl[env];

fs.write('./phantom-log.txt','\nphantomjs starting for ' + host + path, 'a');

getHtml();

function getHtml() {
	//var c = 0;
	fs.write('./phantom-log.txt','\nphantomjs opening ' + host + path, 'a');

	var ready;

	page.open(host + path, function(status) {

		fs.write('./phantom-log.txt','\nphantomjs status = ' + status + ' opening ' + host + path, 'a');

		t = setTimeout(function(){
			fs.write('./phantom-log.txt','\nphantomjs evaluating ' + host + path, 'a');
			ready = page.evaluate(function(){
				return document.getElementById('layout') !== null;
			});
			fs.write('./phantom-log.txt','\nphantomjs success evaluating ' + host + path, 'a');
			//fs.write('./phantom-log.txt','\nphantomjs getting readyState for ' + host + path, 'a');
			fs.write('./phantom-log.txt','\nphantomjs readyState = ' + ready + ' for ' + host + path, 'a');

			if (ready) {
				//clearInterval(t);
				fs.write('./phantom-log.txt','\nphantomjs evaluating ' + host + path, 'a');
				body = page.evaluate(function() {
					return document.getElementById('ibm-content-main');
				});
				fs.write('./phantom-log.txt','\nphantomjs success evaluating ' + host + path, 'a');
				text = body.innerHTML.replace(/<script[^>]*>([\s\S]*?)<\/script>/gm,'');
				fs.write('./phantom-log.txt','\nphantomjs scrape length = ' + text.length + ' for ' + host + path, 'a');
				if (text.length < 1) {
					console.log('[phantomjs log]' + ' ' + 'Scrape empty!');
				}

				else {
					fs.write('./phantom-log.txt','\nphantomjs returning scrape to gulp for ' + host + path, 'a');
					console.log(text);
					fs.write('./phantom-log.txt','\nphantomjs success returning scrape to gulp for ' + host + path, 'a');
				}
				fs.write('./phantom-log.txt','\nphantomjs exiting for' + host + path, 'a');
				phantom.exit();
			}
			else {
				fs.write('./phantom-log.txt','\nphantomjs page timeout for' + host + path, 'a');
				console.log('[phantomjs log]' + ' ' + fileName + ' page timeout, page not executing properly or can\'t find #layout, exiting incomplete... \n');
				//clearInterval(t);
				fs.write('./phantom-log.txt','\nphantomjs exiting for ' + host + path, 'a');
				phantom.exit();
			}

		}, 5000);
	});
}
