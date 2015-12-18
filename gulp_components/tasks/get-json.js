/**
 * save data from staging into local project and format it nice 'n pretty
 */
var gulp = require('gulp'),
	opts = require('../opts');

gulp.task('getJSON', function(done){

	opts.logMsg('\n*****' + 'begin getJSON task' + '*****\n');

	if (opts.config.dataHost.localOverride) {
		opts.logMsg('local override true, no json fetched');
		done();
	}

	else {
		var pages = ['/'],//this array represents all the desired json files, starting w the homepage
				jsonDir = opts.src + '/json/',
				env = opts.argv.prod ? 'prod' : 'stage',
				complete = -1,
				host, protocol;

		host = opts.config.dataHost[env];
		protocol = host.indexOf('https') > -1 ? require('https') : require('http');

		//swap this in to test
		//host = 'http://127.0.0.1/phonic-startersite/SourceCode/_test_json';
		//protocol = require('http');

		//remove existing json subdirectories
		opts.packages.del(jsonDir + '/**/index.json');

		//get the sitenav data first
		doRequest(host + '/sitenav_' + opts.config.localeStr, 'sitenav', function(data){

			//swap this in to test
			//doRequest('/sitenav.json', 'sitenav', function(data){

			//get an item's children and put them in pages array
			function getPagesList(item, cb) {

				if (item.children && item.children.length > 0) {
					for (var i = 0; i < item.children.length; i++) {
						if (typeof item.children[i].section_only === 'undefined' || item.children[i].section_only === 'false' || !item.children[i].section_only) {
							pages.push(item.children[i].url);
						}
						getPagesList(item.children[i]); //recursive for children of children
					}
				}

			}

			//run this first for the homepage and do the child pages on callback

			getPagesList(data.items[0]);

			for (var j = 0; j < pages.length; j++) {


				doRequest(host + '/_design/site/_view/by_url?key=["'+ (j === 0 ? '/' : pages[j]) + '","' + opts.config.localeStr + '"]&include_docs=true', pages[j], function(data){

					//swap this in to test
					//doRequest((pages[j] === '/' ? '' : '/') + pages[j] + 'index.json', pages[j], function(data){

					if (complete === (pages.length)) {
						done();
					}
				});
			}
		});
	}





	function doRequest(dataUrl, page, cb) {

		var outputPath;

		if (page === 'sitenav') {
			outputPath = jsonDir + 'sitenav.json'
		}
		else if (page === '/') {
			outputPath = jsonDir + 'index.json';
		}
		else {
			outputPath = jsonDir + page + 'index.json';
		}

		opts.logMsg('getting json from ' + env + ': ' +dataUrl);


		protocol.get(dataUrl, function(res){
			var body = '', data;

			res.on('data', function(chunk){
				body += chunk;
			});

			res.on('end', function(){

				if (res.statusCode == 200) {

					//var wstream = opts.fs.createWriteStream(outputPath);

					try {
						data  = JSON.parse(body);
					} catch (e) {
						opts.logErr('json parse error: ' + e);
					}

					opts.fs.outputJSON(outputPath,data);

					opts.logMsg('json file saved: ' + outputPath);
					complete++;
					if (cb) {
						cb(data);
					}
				}

				else {
					opts.logErr('json request responded with error code ' + res.statusCode);
				}

			}).on('error', function(e) {
				opts.logErr('error getting json for ' + host + dataUrl + ': ', e);
			});
		});

	}

});
