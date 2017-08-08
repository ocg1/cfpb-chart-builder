'use strict';

var ajax = require( 'xdr' );
var Promise = require('es6-promise').Promise;
var documentReady = require( './utils/document-ready' );
var createChart = require( './charts' );
var process = require( './utils/process-json' );

// IE9 doesn't allow XHR from different protocols until we get files.cf.gov
// onto HTTPS we need to choose how we use S3.
var DATA_SOURCE_BASE = window.location.protocol.indexOf( 'https' ) === -1 ?
                      '//files.consumerfinance.gov/data/' :
                      '//s3.amazonaws.com/files.consumerfinance.gov/data/';

// Let users override the data source root (useful for localhost testing)
DATA_SOURCE_BASE = window.CFPB_CHART_DATA_SOURCE_BASE || DATA_SOURCE_BASE;

/**
 *   Polyfill for Array.indexOf
 */
if ( !Array.prototype.indexOf ) {
  Array.prototype.indexOf = function( elt /* , from */ ) {
    var len = this.length >>> 0;
    var from = Number( arguments[1] ) || 0;
    from = from < 0 ?
         Math.ceil( from ) :
         Math.floor( from );
    if ( from < 0 ) { from += len; }

    for ( ; from < len; from++ ) {
      if ( from in this &&
          this[from] === elt ) { return from; }
    }
    return -1;
  };
}

/***
* When the document is ready, the code for cfpb-chart-builder seeks out chart
* blocks and generates charts inside the designated elements.
*/

documentReady( function() {
  _createCharts();
} );

function _createChart( { el, title, type, color, metadata, source } ) {

  return _loadSource( source ).then( data => {

    return new Promise( function( resolve, reject ) {

      var chart;

      if ( type === 'line-comparison' ) {
        chart = createChart.lineComparison( { el, type, color, data } );
      }

      if ( type === 'line' ) {
        data = process.originations( data[0], metadata );
        if ( typeof data === 'object' ) {
          chart = createChart.line( { el, type, color, data } );
        } else {
          chart.setAttribute( 'data-chart-error', errorStrings[data] );
          console.log( errorStrings[data] );
        }
      }

      if ( type === 'bar' ) {
        data = process.yoy( data[0], metadata );
        if ( typeof data === 'object' ) {
          chart = createChart.bar( { el, type, color, data } );
        } else {
          chart.setAttribute( 'data-chart-error', errorStrings[data] );
          console.log( errorStrings[data] );
        }
      }

      if ( type === 'tile_map' ) {
        data = process.map( data[0], metadata );
        if ( typeof data === 'object' ) {
          chart = createChart.tileMap( { el, type, color, data } );
        } else {
          chart.setAttribute( 'data-chart-error', errorStrings[data] );
          console.log( errorStrings[data] );
        }
      }

      resolve( chart );

    } );

  } );

}

function _createCharts() {

  var charts = document.querySelectorAll( '.cfpb-chart' );

  for (var chart of charts) {
    _createChart({
      el: chart,
      title: chart.getAttribute( 'data-chart-title' ),
      type: chart.getAttribute( 'data-chart-type' ),
      color: chart.getAttribute( 'data-chart-color' ),
      metadata: chart.getAttribute( 'data-chart-metadata' ),
      source: chart.getAttribute( 'data-chart-source' )
    });
  }

}

// GET requests:

function _loadSource( key, callback ) {

  var urls = key.split(';');

  var promises = urls.map( function fetchUrl( url ) {
    return new Promise( function( resolve, reject ) {
      if ( url.indexOf('http') !== 0 ) {
        url = DATA_SOURCE_BASE + url.replace( '.csv', '.json' );
      }
      ajax( { url: url }, function( resp ) {
        if ( resp.error ) {
          reject( resp.error );
        }
        resolve( JSON.parse( resp.data ) );
      } );
    } );
  } );

  return Promise.all( promises );
}

var charts = {
  createChart: _createChart,
  createCharts: _createCharts
}

module.exports = charts;