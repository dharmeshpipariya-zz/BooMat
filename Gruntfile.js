module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        sass: {
            dist: {
                //options: {
                //    style: 'compressed'
                //},
                files: {
                    //'Content/**/css/*.css': 'Content/**/sass/*.scss'
                    'dist/css/boomat.css': 'scss/boomat.scss'
                }
            }
        },
        cssmin: {
            my_target: {
                options: {
                    sourceMap: true
                },
                files: [{
                    expand: true,
                    cwd: 'dist/css/',
                    src: ['*.css', '!*.min.css'],
                    dest: 'dist/css/',
                    ext: '.min.css'
                }]
            }
        },
        watch: {
            scripts: {
                files: [
                    'scss/*.scss'
                ],
                tasks: ['sass', 'cssmin']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['sass', 'cssmin']);

};