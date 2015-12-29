/*!
 * BooMat's Gruntfile
 * https://github.com/DharmeshPipariya/BooMat
 * Copyright 2015 BooMat.
 */

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        //watch: {
        //    sass: {
        //        files: ['sass/**/*.{scss,sass}', 'sass/_partials/**/*.{scss,sass}'],
        //        tasks: ['sass:dist']
        //    },
        //    livereload: {
        //        files: ['*.html', '*.php', 'js/**/*.{js,json}', 'css/*.css', 'img/**/*.{png,jpg,jpeg,gif,webp,svg}'],
        //        options: {
        //            livereload: true
        //        }
        //    }
        //},
        sass: {
            options: {
                sourceMap: true,
                outputStyle: 'compressed'
            },
            dist: {
                files: {
                    'dist/css/boomat.css': 'sass/_boomat.scss'
                }
            }
        }
    });
    //grunt.registerTask('default', ['sass:dist', 'watch']);
    grunt.registerTask('default', ['sass:dist']);
    grunt.loadNpmTasks('grunt-sass');
    //grunt.loadNpmTasks('grunt-contrib-watch');
    //require('load-grunt-tasks')(grunt);
    //grunt.registerTask('default', ['sass']);
};