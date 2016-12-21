module.exports = function(grunt) {
	// Project configuration.
	var vars = {
		name1: "jquery-1.11.3.min"
	};
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		transport: {
			options: {
				idleading: "dist/"
			},
			js1: {
				files: [{
					expand: true,
					cwd: "js/module",
					src: "*.js",
					dest: "build"
				}]
			}
		},
		concat: {
			options: {
				separator: ';',
			},
			dist: {
				src: ['js/areachange/provinces-hotcities.js', 'js/areachange/cities.js', 'js/areachange/area_selectchangeV3.js'],
				dest: 'dest/citychange-v3.min.js'
			},
			jqueryformdist: {
				src: ['js/jqueryform/jquery-form.js', 'js/jqueryform/jquery.md5.js', 'js/jqueryform/jquery.validate.js'],
				dest: 'dest/form-vali-md5.min.js'
			}
		},
		uglify: {
			options: {},
			build: {
				src: 'js/cities-change-v3.js',
				dest: 'dest/citychange-v3.min.js'
			},
			jqueryformbuild: {
				src: 'js/form-vali-md5.js',
				dest: 'dest/form-vali-md5.min.js'
			}
		},
		clean: {
			options: {},
			build: {
				src: ["js/cities-change-v3.js", "js/form-vali-md5.js"]
			}
		},
		cssmin: {
			options: {
				//shorthandCompacting: false,
				// roundingPrecision: -1
			},
			target: {
				files: {
					'css/output.css': ['css/1.css', 'css/2.css']
				}
			}
		},
		replace: {
			demo: {
				src: ["demo.html"],
				dest: "change/demo/",
				replacements: [{
					from: "div",
					to: "p"
				}, {
					from: /\d+/g,
					to: "xxxxxx"
				}]
			}
		},
		watch: {
			scripts: {
				files: ["js/jquery-1.11.3.min.js", "js/sea.js"],
				tasks: ["concat:dist"],
				options: {
					spawn: false
				}
			},
			css: {
				files: ["css/1.css", "css/2/css"],
				tasks: ["cssmin:target"],
				options: {
					spawn: false
				}
			}
		}
	});

	// 加载包含 "uglify" 任务的插件。
	grunt.loadNpmTasks('grunt-cmd-transport');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.event.on('watch', function(action, filepath, target) {
		grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
	});

	// 默认被执行的任务列表。
	// clean 会把合并的文件删除如果需要调试 可以去掉
	grunt.registerTask('default', ['concat']);
	grunt.registerTask("rt", ['replace']);
	grunt.registerTask("jqueryformmin", ['concat:jqueryformdist']);
	// grunt.registerTask("jqueryformmin", ['concat:jqueryformdist']);

	// grunt.registerTask("n", ['concat', 'uglify']);
	grunt.registerTask("createBaseLib", ['concat']);
	grunt.registerTask("t", ['transport']);
};