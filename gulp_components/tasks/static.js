/**
 * run the site in phantomjs, scrape the content, insert into html files
 */

var gulp = require('gulp'),
		opts = require('../opts'),
		packages = require('../packages'),
		plugins = require('../plugins'),
		utils = require('../utils');

//main task in this sequence
gulp.task('static',function(done){

	utils.logImportant('begin static task');

	var exec = require('child_process').exec,
		host = 'http://localhost:' + process.env.bsPort + '/',
		PAGES = ['/'],
		command,
		i= 0;

	getSitenav(function(data){

		getPagesList(data.items[0]);
		utils.logMsg(PAGES.length + ' pages to scrape');
		utils.logMsg('starting scraping');
		runPhantom(PAGES[i]);
	});


	function getSitenav(cb) {

		opts.fs.readFile(opts.paths.tmp + '/json/sitenav.json', {encoding: 'utf8'}, function(err, data){
			if (err) throw err;
			cb(JSON.parse(data));
		});
	}

	function getPagesList(item) {

		if (item.children && item.children.length > 0) {
			for (var i = 0; i < item.children.length; i++) {
				if (typeof item.children[i].section_only === 'undefined' || item.children[i].section_only === 'false' || !item.children[i].section_only) {
					PAGES.push(item.children[i].url);
				}
				getPagesList(item.children[i]); //recursive for children of children
			}
		}
	}

	function runPhantom(page) {

		utils.logMsg('scraping ' + page + ' ...allowing 5s for it to load...');
		command = 'phantomjs bower_components/phonic-build-tasks/static.js ' + host + ' ' + page;
		utils.logImportant('running command: ' + command);
		exec(command, {maxBuffer: 900*1024} ,function(error, stdout, stderr){
			if (stderr) {
				utils.logErr('ERROR: ' + stderr);
				done();
			}
			else if (stdout.indexOf('[phantomjs log]') === 0) {
				utils.logErr('ERROR: ' + stdout);
				done();
			}
			else {
				injectStatic(page, stdout);
				i++;

				if (i < PAGES.length) {
					runPhantom(PAGES[i]);
				}
				else {
					utils.logImportant('Scraping complete!');
					done();
				}
			}
		});
	}

	function injectStatic(path, contents) {
		utils.logMsg('replacing content ...\n');
		var destDir;

		if (path === '/') {
			destDir = opts.paths.dist + path;
		}
		else {
			destDir = opts.paths.dist + '/' + path;
		}

		/*
		contents = packages.htmlmin(contents, {
			collapseWhitespace: true
		});
		*/

		utils.logMsg('creating static file in ' + destDir + 'index.html\n');

		gulp.src(destDir + 'index.html')
				.pipe(plugins.replace(/[\s\S]*/,contents)) //replace all content
				.pipe(gulp.dest(destDir));
	}
});