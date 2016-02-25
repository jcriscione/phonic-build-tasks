/**
 * generate an index.html for each page based on the site map and populate it w metadata
 */
var gulp = require('gulp'),
		opts = require('../opts'),
		packages = require('../packages'),
		plugins = require('../plugins'),
		utils = require('../utils'),
		_ = packages.lodash;

gulp.task('generate-pages', function(done){
	utils.logImportant('begin generate-pages task');

	var dest = process.env.buildDirectory || opts.paths.tmp,
			PAGES = ['/'],//this array represents all the desired json files, starting w the homepage
			complete = 0,
			siteData, template;

	host = opts.config.dataHost.stage;
	protocol = host.indexOf('https') > -1 ? require('https') : require('http');

	//remove existing index.htmls
	opts.fs.remove(dest + '/**/index.html', function(){

		//get the sitenav data first
		getJSON(dest + opts.paths.jsonDir + '/sitenav.json', function(data){

			siteData = data;

			if (!data.items || data.items.length < 1) {
				utils.logErr('no pages defined in sitenav data!');
				return false;
			}

			//get a list of all pages
			getPagesList(data.items[0], function(){

				//load the html template
				getTemplate(function(){

					//make all the pages
					for (var j = 0; j < PAGES.length; j++) {
						createPage(PAGES[j], function(){
							if (complete === (PAGES.length)) {
								done();
							}
						});
					}
				});
			});
		});
	});


	/**
	 * get data from json
	 * @param cb
	 * @param path
	 */
	function getJSON(path, cb) {

		opts.fs.readFile(path, {encoding: 'utf8'}, function(err, data){
			if (err) throw err;
			cb(JSON.parse(data));
		});
	}

	/**
	 * get the index template
	 * @param cb
	 */
	function getTemplate(cb) {

		var template_file = './index_template.html',
			template_file_default = opts.path.join(__dirname,'../index_template.html');

		utils.logMsg('using template ' + template_file);

		try { //see if there's a site-level template
			template = opts.fs.readFileSync(template_file, {encoding: 'utf8'}).toString();
			cb();
		}
		catch(err) { //otherwise use default
			utils.logErr('Project-specific template not found at ' + template_file);
			utils.logMsg('using default template ' + template_file_default + '');

			try {
				template = opts.fs.readFileSync(template_file_default, {encoding: 'utf8'}).toString();
				cb();
			}
			catch(err) {
				utils.logErr(err);
			}
		}
	}

	/**
	 * generate the pages from a template
	 * @param cb
	 */
	function createPage(page,cb) {

		var compiled = _.template(template),
			outputPath;

		if (page === '/') {
			outputPath = '/';
		}
		else {
			outputPath = '/' + page;
		}

		getJSON(dest + opts.paths.jsonDir + outputPath + 'index.json', function(data){

			var file, level, relpath, contents, pageData;

			pageData = data.rows[0].doc;
			//pageData.locations = filterPageData(data.rows[0].doc.locations);
			if (typeof pageData.chat_enabled === 'undefined' || pageData.chat_enabled !== 'true' ) {
				pageData.chat_script = '';
			}

			file = dest + outputPath + 'index.html';
			level = _.filter(outputPath.split('/'), function(i) {
				return !_.isEmpty(i);
			}).length;
			relpath = function() {
				var str = '';
				for (var i = 0; i < level; i++) {
					str += '../';
				}
				return str;
			};

			// populate some stuff in each page
			contents = compiled({
				generatePage: {
					path: outputPath,
					relpath: relpath(),
					pageData: pageData,
					siteData: siteData,
					config: opts.config
				}
			});

			opts.fs.outputFileSync(file, contents);
			utils.logMsg('html file saved: ' + file);

			complete++;
			cb();
		});

	}

	/**
	 * figure out top-level and sub-level pages to get site structure and return a flat array of all pages
	 * @param item object from sitenav that contains all the stuff we want
	 * @param cb
	 */
	function getPagesList(item, cb) {

		if (item.children && item.children.length > 0) {
			for (var i = 0; i < item.children.length; i++) {
				if (!item.children[i].section_only || item.children[i].section_only === 'false') {
					PAGES.push(item.children[i].url);
				}
				getPagesList(item.children[i]); //recursive for children of children
				//TODO: refactor to allow for infinite levels of children
			}
		}

		if (cb) {
			cb();
		}
	}

	/**
	 * filter locations just like front-end app
	 * @param locations
	 * @returns {Array}
	 */
	function filterPageData(locations) {

		var locationsArray = toArray(locations);

		var filteredLocations = [],
				match = false;

		for (var i = 0; i < locationsArray.length; i++) {

			var location = locationsArray[i],
					locationName = location.$key,
					filteredItems = [];

			for (var j = 0; j < location.length; j++) {

				var locationItem = location[j];
				//console.log(location);

				if (typeof locationItem.filters === 'undefined' || isEmpty(locationItem.filters)) {

					match = true;
				}
				else {
					for (var key in locationItem.filters) {

						if (locationItem.filters.hasOwnProperty(key)) {

							if (locationItem.filters[key].length < 1 || locationItem.filters[key] === 'all') {
								match = true;
							}
							else {
								match = false;
								break;
							}
						}
					} // end filter loop
				}

				//console.log('match is ' + match);

				if (match) { // add matching items to this location
					filteredItems.push(location[j]);
				}

			} // end items loop

			if (filteredItems.length > 0) { // if the location has matching items, add them to the set

				filteredItems.$key = locationName;
				filteredLocations.push(filteredItems);
			}
		}

		return filteredLocations;

	}

	/**
	 * see if an obj is empty
	 * @param object
	 * @returns {boolean}
	 */
	function isEmpty(object) {
		for(var key in object) {
			if(object.hasOwnProperty(key)){
				return false;
			}
		}
		return true;
	}

	/**
	 * convert obj to array for when you want to preserve key order
	 * @param obj
	 * @returns {*}
	 */
	function toArray(obj) {
		if (!(obj instanceof Object)) {
			return obj;
		}
		var result = [];

		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				//console.log(key);
				obj[key].$key = key;
				result.push(obj[key]);
			}

		}
		//console.log(result);
		return result;
	}
});
