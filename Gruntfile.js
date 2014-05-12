module.exports = function(grunt) {
    grunt.initConfig({
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    require: 'must'
                },
                src: ['./examples/**/*.test.js']
            }
        },
        docco: {
            docs: {
                src: ['./lib/virgilio-http.js'],
                options: {
                    output: 'docs/'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-docco');

    grunt.registerTask('test', 'mochaTest');
    grunt.registerTask('docs', 'docco');
};
