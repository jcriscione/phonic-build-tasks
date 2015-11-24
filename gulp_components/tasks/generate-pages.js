/**
 * generate an index.html for each page based on the site map
 */
var gulp = require('gulp'),
		opts = require('../opts'),
		_ = require('lodash');

gulp.task('generate-pages', function(done){
	opts.logMsg('\n*****' + 'begin generate-PAGES task' + '*****\n');

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

		opts.logMsg('deleting previous index files');

		opts.packages.nodeDir.subdirs(opts.src, function(err,subdirs){ //get all directories

			if (err) throw err;

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

		var template_file = './index_template.html',
				template_file_default = opts.path.join(__dirname,'../index_template.html'),
				template, compiled;

		opts.logMsg('using template ' + template_file);

		try {
			template = opts.fs.readFileSync(template_file, {encoding: 'utf8'}).toString();
		}
		catch(err) {
			opts.logErr('Project-specific template not found at ' + template_file);
			opts.logMsg('using default template ' + template_file_default + '\n');

			try {
				template = opts.fs.readFileSync(template_file_default, {encoding: 'utf8'}).toString();
			}
			catch(err) {
				opts.logErr(err);
			}
		}

		compiled = _.template(template);

		for (var i= 0; i < PAGES.length; i++) {

			var path, file, level, relpath, contents;

			path = PAGES[i];

			if (path === '/') {
				file = opts.src + '/index.html';
			}
			else {
				file = opts.src + '/' + path+ 'index.html';
			}

			level = path === '/' ? 0 : (path.split('/')).length - 1;
			relpath = function() {
				var str = '';
				for (var i=0;i < level; i++) {
					str += '../';
				}
				return str;
			};

			// populate some stuff in each page
			contents = compiled({
				generatePage: {
					//these are sitewide
					path: path,
					relpath: relpath(),
					locale: opts.config.localeStr,
					country: opts.config.country,
					language: opts.config.language,
					site_owner: sitenav.site_owner,

					//these are page specific and not known at this step
					page_title: '\<%= pageData.page_title %\>', // this means it will get compiled with page-level data in the dist build
					page_description: '\<%= pageData.page_description %\>',
					page_keywords: '\<%= pageData.page_keywords %\>',
					og_title: '\<%= pageData.og_title %\>',
					og_image: '\<%= pageData.og_image %\>',
					og_url: '\<%= pageData.og_url %\>',
					og_description: '\<%= pageData.og_description %\>',
					site_nav_label: '\<%= pageData.site_nav_label %\>',
					chat_script: '\<%= pageData.chat_script %\>'

				}
			});

			opts.fs.outputFileSync(file, contents);
			opts.logMsg('html file saved: ' + file);
		}

		cb();

	}

});
