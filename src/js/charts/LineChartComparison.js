import accessibility from 'highcharts/js/modules/accessibility';
import Highcharts from 'highcharts/js/highstock';
import * as process from '../utils/process-json';

accessibility( Highcharts );

Highcharts.setOptions( {
  lang: {
    rangeSelectorZoom: '',
    thousandsSep: ','
  }
} );

/**
 * _getTickValue - Convert the data point's unit to M or B.
 *
 * @param {number} value - Data point's value
 * @returns {number} Data point's value over million or billion.
 */
function _getTickValue( value ) {
  // If borked data gets passed in, return it.
  if ( isNaN( value ) ) {
    return value;
  }
  return Highcharts.numberFormat( value * 100, 1 ) + '%';
}

class LineChartComparison {

  constructor( { el, description, data } ) {

    this.chartOptions = {
      chart: {
        marginRight: 0,
        marginTop: 100,
        zoomType: 'none',
        animation: false
      },
      className: 'cfpb-chart_line-comparison',
      description: description,
      credits: false,
      rangeSelector: {
        enabled: false
      },
      legend: {
        align: 'left',
        enabled: true,
        floating: false,
        layout: 'horizontal',
        verticalAlign: 'top',
        useHTML: true,
        x: 0,
        y: 0
      },
      plotOptions: {
        series: {
          states: {
            hover: {
              enabled: false
            }
          },
          events: {
            legendItemClick: () => false
          }
        }
      },
      navigator: {
        enabled: false
      },
      scrollbar: {
        enabled: false
      },
      xAxis: {
        startOnTick: true,
        tickLength: 5,
        type: 'datetime',
        dateTimeLabelFormats: {
          month: '%b<br/>%Y',
          year: '%b<br/>%Y'
        }
      },
      yAxis: {
        showLastLabel: true,
        min: 0,
        opposite: false,
        className: 'axis-label',
        labels: {
          formatter: function() {
            return _getTickValue( this.value );
          }
        }
      },
      tooltip: {
        useHTML: true,
        formatter: function() {
          let tooltip = Highcharts.dateFormat( '%B %Y', this.x );
          for ( let i = 0; i < this.points.length; i++ ) {
            const point = this.points[i];
            tooltip += "<br><span class='highcharts-color-" +
                       point.series.colorIndex + "'></span> " +
                       point.series.name + ': ' +
                       Highcharts.numberFormat( point.y * 100, 1 ) + '%';
          }
          return tooltip;
        }
      },
      series: this.constructor.getSeries( data )
    };

    // TODO: remove when gulp build config is updated to handle spread operator.
    // eslint-disable-next-line prefer-object-spread
    this.chart = Highcharts.stockChart( el, Object.assign( {}, this.chartOptions ) );
  }

  static getSeries( data ) {
    data = process.processDelinquencies( data );
    data = data.map( datum => ( {
      name: datum.label,
      data: datum.data,
      legendIndex: 1,
      tooltip: {
        valueDecimals: 0
      }
    } ) );
    return data;
  }

  update( newOpts ) {

    let newSeries;

    // Merge the old chart options with the new ones.
    Object.assign( this.chartOptions, newOpts );

    this.chart.update( this.chartOptions );

    // If there's new data involved, delete all series and recreate them.
    if ( newOpts.data ) {
      // Remove all series
      while ( this.chart.series && this.chart.series.length > 0 ) {
        this.chart.series[0].remove( true );
      }
      newSeries = this.constructor.getSeries( newOpts.data );
      newSeries.forEach( series => {
        this.chart.addSeries( series );
      } );
    }
    this.chart.hideLoading();
  }

}

export default LineChartComparison;
