const gulp = require( 'gulp' );
const connect = require( 'gulp-connect' );
const cors = require( 'cors' );
const compression = require( 'compression' );

gulp.task( 'connect', () => {
  connect.server( {
    port: 8081,
    root: [ 'test', 'dist' ],
    middleware: () => [ compression(), cors() ]
  } );
} );
