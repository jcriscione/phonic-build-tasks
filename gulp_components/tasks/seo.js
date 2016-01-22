//replace /SourceCode/bower_components/phonic-build-tasks/gulp_components/tasks/seo.js

/**
 * run the site in phantomjs, scrape the content, insert it into noscript tags
 */

var gulp = require('gulp'),
		opts = require('../opts');

//main task in this sequence
gulp.task('seo',function(done){

	opts.logMsg('\n*****' + 'begin seo task' + '*****\n');

	var sys = require('sys'),
			exec = require('child_process').exec,
			args = opts.packages.yargs.argv,
			PAGES = ['/'],
			command, env,
			i= 0;

	getSitenav(function(data){

		getPagesList(data.items[0]);
		opts.logMsg('starting seo scraping...');
		env = args.stage ? 'stage' : 'prod';
		opts.logMsg(PAGES.length + ' pages total');
		runPhantom(PAGES[i]);
	});


	function getSitenav(cb) {

		opts.fs.readFile(opts.src + '/json/sitenav.json', {encoding: 'utf8'}, function(err, data){
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

		opts.logMsg('scraping page ' + (i+1) + ', path: ' + page);
		command = 'phantomjs bower_components/phonic-build-tasks/seo.js ' + env + ' ' + page;
		exec(command, {maxBuffer: 200*2048} ,function(error, stdout, stderr){
			if (stderr) {
				opts.logErr('************ ERROR: ' + stderr);
				done();
			}
			else if (stdout.indexOf('[phantomjs log]') === 0) {
				opts.logErr('************ ERROR: ' + stdout);
				done();
			}
			else {
				opts.logMsg('successful scrape for page ' + (i+1) + ', path: ' + page);
				injectSeo(page, stdout);
				i++;

				if (i < PAGES.length) {
					runPhantom(PAGES[i]);
				}
				else {
					opts.logMsg('scraping complete\n');
					done();
				}
			}
		});
	}

	function injectSeo(path, contents) {
		var destDir;


		if (path === '/') {
			destDir = opts.dist + path;
		}
		else {
			destDir = opts.dist + '/' + path;
		}
		opts.logMsg('starting htmlmin for path ' + destDir);
		contents = opts.packages.htmlmin(contents, {
			removeComments: true,
			collapseWhitespace: true
		});
		opts.logMsg('finished htmlmin for path ' + destDir);
		opts.logMsg('injecting seo into ' + destDir + 'index.html...');
		//opts.logMsg(contents);

		gulp.src(destDir + 'index.html')
				.pipe(opts.plugins.replace(/<noscript id="seo"[^>]*>([\s\S]*?)<\/noscript>/gm,'')) //remove any previous instances of noscript block
				.pipe(opts.plugins.injectString.before('<div id="ibm-footer">', '<noscript id="seo">'+ contents + '</noscript>\n'))
				.pipe(gulp.dest(destDir));
	}
});
