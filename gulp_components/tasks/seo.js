//replace /SourceCode/bower_components/phonic-build-tasks/gulp_components/tasks/seo.js

/**
 * run the site in phantomjs, scrape the content, insert it into noscript tags
 */

var gulp = require('gulp'),
		opts = require('../opts'),
		_ = require('lodash');

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
			else if (stdout.indexOf('complete') === 0) {
				opts.logMsg('successful scrape for page ' + (i+1) + ', path: ' + page);
				injectSeo(page);
				i++;

				if (i < PAGES.length) {
					runPhantom(PAGES[i]);
				}
				else {
					opts.logMsg('scraping complete\n');
					done();
				}
			}
			else {
				opts.logErr('************ ERROR: ' + stdout);
				done();
			}
		});
	}

	function injectSeo(path) {
		var destDir,
			contents;

		path = path === '/' ? path : '/' + path;
		opts.fs.readFile(opts.seoTemp + path + 'index.txt', {encoding: 'utf8'}, function(err, data){
			if (err) throw err;

			contents = data;

			destDir = opts.dist + path;

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
		});


	}
});

gulp.task('generate-temp-seo', function(done){
	opts.logMsg('\n*****' + 'begin generate-temp-seo task' + '*****\n');

	var PAGES = ['/'],//this array represents all the desired index PAGES, starting w the homepage
			sitenav = {};


	getSitenav(function(data){
		sitenav = data;
		getPagesList(sitenav.items[0]);
		cleanPages(function(){
			createPages(function(){
				done();
			});
		});
	});

	/**
	 * get sitenav data
	 * @param cb
	 */
	function getSitenav(cb) {

		opts.logMsg('getting pages list from sitenav.json' + '\n');

		opts.fs.readFile(opts.src + '/json/sitenav.json', {encoding: 'utf8'}, function(err, data){
			if (err) throw err;
			cb(JSON.parse(data));
		});
	}


	//remove existing index PAGES
	function cleanPages(cb) {

		opts.logMsg('deleting previous temp files');



		opts.packages.nodeDir.subdirs(opts.seoTemp, function(err,subdirs){ //get all directories

			if (err) {
				cb();
			}

			else {
				var i = 0;

				subdirs.reverse(); //want to check inner directories first

				//console.log(subdirs);

				deleteEmpty();

				function deleteEmpty() {
					var dir = subdirs[i];
					//opts.logMsg(dir);
					opts.fs.readdir(dir, function(err,files) {

						if (err) throw err;

						if (files.length < 1 || (files.length === 1 && files[0] === 'index.html')) {

							opts.packages.del(dir,function(){
								i++;
								if (i === subdirs.length) {
									cb();
								}
								else {
									deleteEmpty();
								}
							});
						}
						else {
							i++;
							if (i === subdirs.length) {
								cb();
							}
							else {
								deleteEmpty();
							}
						}
					});
				}
			}

		});


	}

	/**
	 * figure out top-level and sub-level pages to get site structure
	 * @param item object from sitenav that contains all the stuff we want
	 */
	function getPagesList(item) {

		if (item.children && item.children.length > 0) {
			for (var i = 0; i < item.children.length; i++) {
				if (typeof item.children[i].section_only === 'undefined' || item.children[i].section_only === 'false' || !item.children[i].section_only) {
					PAGES.push(item.children[i].url);
				}
				getPagesList(item.children[i]); //recursive for children of children
				//TODO: refactor to allow for infinite levels of children
			}
		}
	}

	/**
	 * generate the pages from a template
	 * @param cb
	 */
	function createPages(cb) {

		for (var i= 0; i < PAGES.length; i++) {

			var path, file, level, relpath;

			path = PAGES[i];

			if (path === '/') {
				file = opts.seoTemp + '/index.txt';
			}
			else {
				file = opts.seoTemp + '/' + path+ 'index.txt';
			}

			level = path === '/' ? 0 : (path.split('/')).length - 1;
			relpath = function() {
				var str = '';
				for (var i=0;i < level; i++) {
					str += '../';
				}
				return str;
			};

			opts.fs.outputFileSync(file, '');
			opts.logMsg('txt file saved: ' + file);
		}

		cb();

	}

});
