var system = require('system'),
		page = require('webpage').create(),
		fs = require('fs'),
		host, fileName, content, t, path, body, text;

if (system.args[1] && system.args[2]) {
	host = system.args[1];
	fileName = system.args[2];
	path = system.args[2] === '/' ? '' : '/' + system.args[2];
	getHtml();
}
else {
	console.log('[phantomjs log]' + ' ' + 'No path supplied!');
	phantom.exit();
}


function getHtml() {

	var ready = false;


	/**
	 * invoked when a JS error is not handled by page.onError
	 * @param msg
	 * @param trace
     */
	phantom.onError = function(msg, trace) {
		var msgStack = ['PHANTOM ERROR: ' + msg];
		if (trace && trace.length) {
			msgStack.push('TRACE:');
			trace.forEach(function(t) {
				msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
			});
		}
		console.error(msgStack.join('\n'));
		phantom.exit(1);
	};

	/**
	 * this is used to suppress any errors on the stdout
	 * prevents errors from being injected into the final static html
	 * @param msg
	 * @param trace
     */
	page.onError = function(msg, trace) {
		var msgStack = ['ERROR: ' + msg];
		if (trace && trace.length) {
			msgStack.push('TRACE:');
			trace.forEach(function(t) {
				msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
			});
		}
	}

	/**
	 * open the page in browser, give it time to load and then pull the  content of the layout div.
	 */
	page.open(host + path, function() {

		t = setInterval(function(){

			// ensure that the Angular templates have rendered
			ready = page.evaluate(function(){
				return document.getElementById('layout') !== null;
			});

			if (ready) {
				clearInterval(t);
				// content = page.content; // full content of entire page
				body = page.evaluate(function() {
					return document.getElementById('layout');
				});
				text = body.innerHTML.replace(/<script[^>]*>([\s\S]*?)<\/script>/gm,'');
				if (text.length < 1) {
					console.log('[phantomjs log]' + ' ' + 'Scrape empty!');
				} else {
					console.log(text);
				}
				phantom.exit();
			}
			else {
				console.log('[phantomjs log]' + ' ' + host + path + ' page timeout, page not executing properly or can\'t find #layout, exiting incomplete... \n');
				clearInterval(t);
				phantom.exit();
			}

		}, 5000);

		/*

		t = setInterval(function(){

			// ensure that the Angular templates have rendered
			ready = page.evaluate(function(){
				return document.getElementById('layout') !== null;
			});


			if (ready) {
				clearInterval(t);

				content = page.evaluate(function() {
					return document.getElementById('layout');
				});
				var layout = content.innerHTML.replace(/<script[^>]*>([\s\S]*?)<\/script>/gm,'');

				if (text.length < 1) {
					console.log('[phantomjs log]' + ' ' + 'Scrape empty!');
				} else {
					console.log(layout);
				}
				
				
				/*
				content = page.content;

				if (content.length < 1) {
					console.log('[phantomjs log]' + ' ' + 'Scrape empty!');
				} else {
					console.log(content);
				}
				*/

		/*

				phantom.exit();
			}
			else {
				console.log('[phantomjs log]' + ' ' + host + path + ' page timeout, page not executing properly or can\'t find #layout, exiting incomplete... \n');
				clearInterval(t);
				phantom.exit();
			}

		}, 5000);


		*/
	});
}