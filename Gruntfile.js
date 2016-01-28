/*!
 * BooMat's Gruntfile
 * https://github.com/DharmeshPipariya/BooMat
 * Copyright 2016 BooMat.
 */

module.exports = function (grunt) {
    grunt.initConfig({
        sass: {
            dist: {
                files: [{
                    src: 'scss/*.scss',
                    dest: 'dist/css',
                    expand: true,
                    ext: '.css'
                }]
            }
        },
        autoprefixer: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '.dist/css',
                    src: '{,*/}*.css',
                    dest: 'dist/css'
                }]
            }
        },
        watch: {
            styles: {
                files: ['scss/*.scss'],
                tasks: ['sass:dist', 'autoprefixer:dist']
            }
        }
    });
    grunt.registerTask('default', ['styles', 'watch']);
};


