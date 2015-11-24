//pre-populate page-level data from cms into dist htmls using lodash
//TODO: consolidate this and generate-pages into one task

var gulp = require('gulp'),
	opts = require('../opts'),
	_ = require('lodash');

gulp.task('getMetaData', function(done){
	opts.logMsg('\n*****' + 'begin getMetaData task' + '*****\n');

	var PAGES = ['/'],//this array represents all the desired index PAGES, starting w the homepage
		complete = 0;

	getSitenav(function(data){
		getPagesList(data.items[0]);
		for (var i= 0; i < PAGES.length; i++) {

			var path, file;

			path = PAGES[i];

			if (path === '/') {
				file = '/';
			}
			else {
				file = '/' + path;
			}
			getData(file);
		}
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

	function getData(file) {

		var jsonDir = opts.src + '/json';

		opts.logMsg('getting metadata from: ' + jsonDir + file + 'index.json');

		opts.fs.readFile(jsonDir + file + 'index.json', {encoding: 'utf8'}, function(err, data){
			if (err) throw err;
			complete++;
			injectData(file, JSON.parse(data));
		});
	}

	function injectData(file, data) {

		var contents = {
			pageData: data.rows[0].doc
		};

		if (typeof contents.pageData.chat_enabled === 'undefined' || contents.pageData.chat_enabled === 'true') {
			contents.pageData.chat_script = '';
		}

		opts.logMsg('injecting metadata into: ' + opts.dist + file + 'index.html');

		gulp.src(opts.dist + file + 'index.html')
				.pipe(opts.plugins.template(contents))
				.pipe(gulp.dest(opts.dist + file));

		if (complete === (PAGES.length)) {
			done();
		}
	}
});
