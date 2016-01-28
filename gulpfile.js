var gulp = require('gulp'),
	opts = require('./gulp_components/opts');

/**
 * prevents gulp from exiting on stream errs
 * https://github.com/gulpjs/gulp/issues/71
 */
require('./gulp_components/fix-pipe');


/**
 * any tasks in '/gulp_components/tasks/*.js' are accessible here.
 */
opts.packages.requireDir(__dirname + '/gulp_components/tasks');

gulp.task('setup', function(callback) {

	opts.packages.runSequence('app-config','getJSON','generate-pages', callback);
});

gulp.task('dev', function(callback) {
	opts.packages.runSequence('wiredep','ng-templates', 'injectjsDev', 'less','lessIE', callback);
});

gulp.task('default', function(callback) {
	opts.packages.runSequence('dev', 'watch', callback);
});

gulp.task('dist', function(callback) {
	opts.packages.runSequence('setup', ['dev', 'clean'], 'move', 'usemin', 'imagemin', 'injectjsDist', 'htmlmin', 'getMetaData', 'generate-temp-seo', 'seo', callback);
});
