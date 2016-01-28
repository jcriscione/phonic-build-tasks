var gutil = require('gulp-util');

module.exports = {
	plugins : require('gulp-load-plugins')({pattern: 'gulp-*'}),
	packages: require('gulp-load-plugins')({pattern: ['*','!gulp-*']}),
	argv: require('yargs')().argv,
	fs: require('fs-extra'),
	path: require('path'),
	src: './src',
	dist: './dist',
	seoTemp: './_seo-temp',
	cssDir: '/css',
	imgDir: '/i',
	jsDir: '/js',
	homepage: '/index.html',
	categoryPages: '/*/**/index.html',
	ngTemplates: '/templates/**/*.html',
	config: require(process.cwd() + '/config'),
	staticAssets : ['/**/*.{css,map,woff,eot,ttf,json,gif,mp4,ogv,webm}'],
	getProjectTitle: function(cb) {

		require('read-package-json')('./package.json',function(err,data){
			var title = '';

			if (data && data.name) {
				title = ' "' + data.name + '"';
			}

			cb(title);
		});
	},
	logMsg: function(msg) {
		gutil.log(gutil.colors.cyan(msg));
	},
	logErr: function(err) {
		gutil.log(gutil.colors.red(err));
	}
};
