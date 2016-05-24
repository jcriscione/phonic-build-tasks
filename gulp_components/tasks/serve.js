var gulp = require('gulp'),
	opts = require('../opts'),
	packages = require('../packages'),
	plugins = require('../plugins'),
	utils = require('../utils');

gulp.task('serve', function(done){

	var dest = process.env.buildDirectory || opts.paths.tmp,
		browserSync = packages.browserSync.create();

	console.log(dest);

	browserSync.init({
		server: {
			baseDir: dest
		}
	}, function(err, instance){
		process.env.bsPort = instance.options.get('port');
		packages.nodeNotifier.notify({
			'title': 'Phonic',
			'message': 'Serving ' + process.cwd() + dest
		});
		done();
	});


	if (dest !== opts.paths.dist) {
		console.log('watching');
		gulp.watch(
			'./config.js',
			gulp.series(
				'app-config',
				'concat-js:dev:app',
				function(done) {
					browserSync.reload();
					done();
				}
		));
		gulp.watch(
			opts.paths.src + '/**/*.less',
			gulp.series(
				'less:dev',
				function(done) {
					browserSync.reload();
					done();
				}
		));
		gulp.watch(
			opts.paths.src + opts.paths.jsDir + '/_lib/**/*.js',
			gulp.series(
				'concat-js:dev:lib',
				function(done) {
					browserSync.reload();
					done();
				}
		));
		gulp.watch([
			opts.paths.src + '/**/*.js',
			'!' + opts.paths.src + opts.paths.jsDir + '/_lib/**/*.js'
			],
			gulp.series(
				'concat-js:dev:app',
				function(done) {
					browserSync.reload();
					done();
				}
		));
		gulp.watch(
			opts.paths.src + opts.paths.ngTemplates,
			gulp.series(
				'ng-templates',
				'concat-js:dev:app',
				function(done) {
					browserSync.reload();
					done();
				}
		));
		gulp.watch(
			opts.paths.src + opts.paths.imgDir + '/**/*',
			gulp.series(
				'images:dev',
				function(done) {
					browserSync.reload();
					done();
				}
		));
	}
});
