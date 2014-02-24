'use strict';
// * 'grunt' - watching (Sass, Server on 127.0.0.1:9000 with LiveReload)
// * 'grunt build' - Sass
// * 'grunt validate-js' - JSHint
// * 'grunt publish' - dist directory
// * 'grunt server-dist' - server on 127.0.0.1:9001 - dist directory (preview only)

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		sass: {
			options: {
				includePaths: ['app/bower_components/foundation/scss']
			},
			dist: {
				options: {
					outputStyle: 'extended'
				},
				files: {
					'app/css/app.css': 'app/scss/app.scss'
				}
			}
		},

		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: [
				'Gruntfile.js',
				'app/js/**/*.js'
			]
		},

		clean: {
			dist: {
				src: ['dist/*']
			},
		},
		copy: {
			dist: {
				files: [{
					expand: true,
					cwd:'app/',
					src: ['images/**', 'fonts/**', '**/*.html', '!**/*.scss', '!bower_components/**'],
					dest: 'dist/'
				} , {
					expand: true,
					flatten: true,
					src: ['app/bower_components/font-awesome/fonts/**'],
					dest: 'dist/fonts/',
					filter: 'isFile'
				} ]
			},
		},

		uncss: {
			dist: {
				files: {
					'.tmp/concat/css/app.min.css': ['app/**/*.html', '!app/bower_components/**']
				}
			}
		},

		uglify: {
			options: {
				preserveComments: 'some',
				mangle: false
			}
		},

		useminPrepare: {
			html: ['app/**/*.html', '!app/bower_components/**'],
			options: {
				dest: 'dist'
			}
		},

		usemin: {
			html: ['dist/**/*.html', '!app/bower_components/**'],
			css: ['dist/css/**/*.css'],
			options: {
				dirs: ['dist']
			}
		},

		watch: {
			grunt: {
				files: ['Gruntfile.js'],
				tasks: ['sass']
			},
			sass: {
				files: 'app/scss/**/*.scss',
				tasks: ['sass']
			},
			livereload: {
				files: ['app/**/*.html', '!app/bower_components/**', 'app/js/**/*.js', 'app/css/**/*.css', 'app/images/**/*.{jpg,gif,svg,jpeg,png}'],
				options: {
					livereload: true
				}
			}
		},

		connect: {
			app: {
				options: {
					port: 9000,
					base: 'app/',
					livereload: true
				}
			},
			dist: {
				options: {
					port: 9001,
					base: 'dist/',
					keepalive: true,
					livereload: false
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-uncss');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-usemin');

	grunt.registerTask('build', ['sass']);
	grunt.registerTask('default', ['build', 'connect:app', 'watch']);
	grunt.registerTask('validate-js', ['jshint']);
	grunt.registerTask('server-dist', ['connect:dist']);
	grunt.registerTask('publish', ['clean:dist', 'validate-js', 'useminPrepare', 'copy:dist', 'concat', 'cssmin', 'uglify', 'usemin']);

};
