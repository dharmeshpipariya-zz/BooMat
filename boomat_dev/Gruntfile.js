module.exports = function (grunt) {
    'use strict';

    // Force use of Unix newlines
    grunt.util.linefeed = '\n';

    RegExp.quote = function (string) {
        return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    var fs = require('fs');
    var path = require('path');
    var glob = require('glob');
    var isTravis = require('is-travis');
    var npmShrinkwrap = require('npm-shrinkwrap');
    var mq4HoverShim = require('mq4-hover-shim');
    var autoprefixerSettings = require('./grunt/autoprefixer-settings.js');
    var autoprefixer = require('autoprefixer')(autoprefixerSettings);

    var generateCommonJSModule = require('./grunt/bs-commonjs-generator.js');
    var configBridge = grunt.file.readJSON('./grunt/configBridge.json', { encoding: 'utf8' });

    Object.keys(configBridge.paths).forEach(function (key) {
        configBridge.paths[key].forEach(function (val, i, arr) {
            arr[i] = path.join('./docs/assets', val);
        });
    });

    // Project configuration.
    grunt.initConfig({

        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            dist: 'dist',
            docs: 'docs/dist'
        },


        scsslint: {
            options: {
                bundleExec: true,
                config: 'scss/.scss-lint.yml',
                reporterOutput: null
            },
            core: {
                src: ['scss/*.scss', '!scss/_normalize.scss']
            },
            docs: {
                src: ['docs/assets/scss/*.scss', '!scss/_normalize.scss', '!docs/assets/scss/docs.scss']
            }
        },

        postcss: {
            core: {
                options: {
                    map: true,
                    processors: [
                      mq4HoverShim.postprocessorFor({ hoverSelectorPrefix: '.bs-true-hover ' }),
                      autoprefixer
                    ]
                },
                src: 'dist/css/*.css'
            },
            docs: {
                options: {
                    processors: [
                      autoprefixer
                    ]
                },
                src: 'docs/assets/css/docs.min.css'
            },
            examples: {
                options: {
                    processors: [
                      autoprefixer
                    ]
                },
                expand: true,
                cwd: 'docs/examples/',
                src: ['**/*.css'],
                dest: 'docs/examples/'
            }
        },

        cssmin: {
            options: {
                // TODO: disable `zeroUnits` optimization once clean-css 3.2 is released
                //    and then simplify the fix for https://github.com/twbs/bootstrap/issues/14837 accordingly
                compatibility: 'ie9',
                keepSpecialComments: '*',
                sourceMap: true,
                advanced: false
            },
            core: {
                files: [
                  {
                      expand: true,
                      cwd: 'dist/css',
                      src: ['*.css', '!*.min.css'],
                      dest: 'dist/css',
                      ext: '.min.css'
                  }
                ]
            },
            docs: {
                src: 'docs/assets/css/docs.min.css',
                dest: 'docs/assets/css/docs.min.css'
            }
        },

        csscomb: {
            options: {
                config: 'scss/.csscomb.json'
            },
            dist: {
                expand: true,
                cwd: 'dist/css/',
                src: ['*.css', '!*.min.css'],
                dest: 'dist/css/'
            },
            examples: {
                expand: true,
                cwd: 'docs/examples/',
                src: '**/*.css',
                dest: 'docs/examples/'
            },
            docs: {
                src: 'docs/assets/css/src/docs.css',
                dest: 'docs/assets/css/src/docs.css'
            }
        },

        copy: {
            docs: {
                expand: true,
                cwd: 'dist/',
                src: [
                  '**/*'
                ],
                dest: 'docs/dist/'
            }
        },

        connect: {
            server: {
                options: {
                    port: 3000,
                    base: '.'
                }
            }
        },

        jekyll: {
            options: {
                bundleExec: true,
                config: '_config.yml',
                incremental: false
            },
            docs: {},
            github: {
                options: {
                    raw: 'github: true'
                }
            }
        },

        watch: {
            src: {
                files: '<%= jscs.core.src %>',
                tasks: ['babel:dev']
            },
            sass: {
                files: 'scss/**/*.scss',
                tasks: ['dist-css', 'docs']
            },
            docs: {
                files: 'docs/assets/scss/**/*.scss',
                tasks: ['dist-css', 'docs']
            }
        },

        'saucelabs-qunit': {
            all: {
                options: {
                    build: process.env.TRAVIS_JOB_ID,
                    concurrency: 10,
                    maxRetries: 3,
                    maxPollRetries: 4,
                    urls: ['http://127.0.0.1:3000/js/tests/index.html?hidepassed'],
                    browsers: grunt.file.readYAML('grunt/sauce_browsers.yml')
                }
            }
        },

        exec: {
            npmUpdate: {
                command: 'npm update'
            }
        },

        buildcontrol: {
            options: {
                dir: '_gh_pages',
                commit: true,
                push: true,
                message: 'Built %sourceName% from commit %sourceCommit% on branch %sourceBranch%'
            },
            pages: {
                options: {
                    remote: 'git@github.com:twbs/derpstrap.git',
                    branch: 'gh-pages'
                }
            }
        }


    });


    // These plugins provide necessary tasks.
    require('load-grunt-tasks')(grunt, {
        scope: 'devDependencies',
        // Exclude Sass compilers. We choose the one to load later on.
        pattern: ['grunt-*', '!grunt-sass', '!grunt-contrib-sass']
    });
    require('time-grunt')(grunt);

    // Docs HTML validation task
    grunt.registerTask('validate-html', ['jekyll:docs', 'htmllint']);

    var runSubset = function (subset) {
        return !process.env.TWBS_TEST || process.env.TWBS_TEST === subset;
    };
    var isUndefOrNonZero = function (val) {
        return val === undefined || val !== '0';
    };

    // Test task.
    var testSubtasks = [];
    // Skip core tests if running a different subset of the test suite
    if (runSubset('core') &&
        // Skip core tests if this is a Savage build
      process.env.TRAVIS_REPO_SLUG !== 'twbs-savage/bootstrap') {
        testSubtasks = testSubtasks.concat(['dist-css', 'dist-js', 'test-scss', 'test-js', 'docs']);
    }
    // Skip HTML validation if running a different subset of the test suite
    if (runSubset('validate-html') &&
        isTravis &&
        // Skip HTML5 validator when [skip validator] is in the commit message
        isUndefOrNonZero(process.env.TWBS_DO_VALIDATOR)) {
        testSubtasks.push('validate-html');
    }
    // Only run Sauce Labs tests if there's a Sauce access key
    if (typeof process.env.SAUCE_ACCESS_KEY !== 'undefined' &&
        // Skip Sauce if running a different subset of the test suite
        runSubset('sauce-js-unit') &&
        // Skip Sauce on Travis when [skip sauce] is in the commit message
        isUndefOrNonZero(process.env.TWBS_DO_SAUCE)) {
        testSubtasks.push('babel:dev');
        testSubtasks.push('connect');
        testSubtasks.push('saucelabs-qunit');
    }
    grunt.registerTask('test', testSubtasks);
    grunt.registerTask('test-js', ['eslint', 'jscs:core', 'jscs:test', 'jscs:grunt', 'qunit']);

    // JS distribution task.
    grunt.registerTask('dist-js', ['babel:dev', 'concat', 'lineremover', 'babel:dist', 'stamp', 'uglify:core', 'commonjs']);

    grunt.registerTask('test-scss', ['scsslint:core']);

    // CSS distribution task.
    // Supported Compilers: sass (Ruby) and libsass.
    (function (sassCompilerName) {
        require('./grunt/bs-sass-compile/' + sassCompilerName + '.js')(grunt);
    })(process.env.TWBS_SASS || 'libsass');
    // grunt.registerTask('sass-compile', ['sass:core', 'sass:extras', 'sass:docs']);
    grunt.registerTask('sass-compile', ['sass:core', 'sass:docs']);

    grunt.registerTask('dist-css', ['sass-compile', 'postcss:core', 'csscomb:dist', 'cssmin:core', 'cssmin:docs']);

    // Full distribution task.
    grunt.registerTask('dist', ['clean:dist', 'dist-css', 'dist-js']);

    // Default task.
    grunt.registerTask('default', ['clean:dist', 'test']);

    grunt.registerTask('commonjs', ['babel:umd', 'npm-js']);

    grunt.registerTask('npm-js', 'Generate npm-js entrypoint module in dist dir.', function () {
        var srcFiles = Object.keys(grunt.config.get('babel.umd.files')).map(function (filename) {
            return './' + path.join('umd', path.basename(filename))
        })
        var destFilepath = 'dist/js/npm.js';
        generateCommonJSModule(grunt, srcFiles, destFilepath);
    });

    // Docs task.
    grunt.registerTask('docs-css', ['postcss:docs', 'postcss:examples', 'csscomb:docs', 'csscomb:examples', 'cssmin:docs']);
    grunt.registerTask('lint-docs-css', ['scsslint:docs']);
    grunt.registerTask('docs-js', ['uglify:docsJs']);
    grunt.registerTask('lint-docs-js', ['jscs:assets']);
    grunt.registerTask('docs', ['lint-docs-css', 'docs-css', 'docs-js', 'lint-docs-js', 'clean:docs', 'copy:docs']);
    grunt.registerTask('docs-github', ['jekyll:github']);

    grunt.registerTask('prep-release', ['dist', 'docs', 'docs-github', 'compress']);

    // Publish to GitHub
    grunt.registerTask('publish', ['buildcontrol:pages']);

    // Task for updating the cached npm packages used by the Travis build (which are controlled by test-infra/npm-shrinkwrap.json).
    // This task should be run and the updated file should be committed whenever Bootstrap's dependencies change.
    grunt.registerTask('update-shrinkwrap', ['exec:npmUpdate', '_update-shrinkwrap']);
    grunt.registerTask('_update-shrinkwrap', function () {
        var done = this.async();
        npmShrinkwrap({ dev: true, dirname: __dirname }, function (err) {
            if (err) {
                grunt.fail.warn(err);
            }
            var dest = 'grunt/npm-shrinkwrap.json';
            fs.renameSync('npm-shrinkwrap.json', dest);
            grunt.log.writeln('File ' + dest.cyan + ' updated.');
            done();
        });
    });
};
