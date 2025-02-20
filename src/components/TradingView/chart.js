/* eslint-disable no-unused-vars */
import React, { useEffect, useState, memo } from 'react';
// import Datafeed from './datafeed';
import Datafeed_v2 from './datafeed';
const TIMEZONE = {
  '-10': ['Pacific/Honolulu'],
  '-8': ['America/Anchorage', 'America/Juneau'],
  '-7': ['America/Los_Angeles', 'America/Phoenix', 'America/Vancouver'],
  '-6': ['America/Mexico_City'],
  '-5': ['America/Bogota', 'America/Chicago', 'America/Lima'],
  '-4': ['America/Caracas', 'America/New_York', 'America/Santiago', 'America/Toronto'],
  '-3': ['America/Argentina/Buenos_Aires', 'America/Sao_Paulo'],
  0: ['Atlantic/Reykjavik'],
  1: ['Africa/Casablanca', 'Africa/Lagos', 'Europe/London'],
  2: [
    'Europe/Belgrade',
    'Europe/Berlin',
    'Europe/Bratislava',
    'Europe/Brussels',
    'Europe/Budapest',
    'Europe/Copenhagen',
    'Africa/Johannesburg',
    'Europe/Luxembourg',
    'Europe/Madrid',
    'Europe/Oslo',
    'Europe/Paris',
    'Europe/Rome',
    'Europe/Stockholm',
    'Europe/Warsaw',
    'Europe/Zurich',
  ],
  3: [
    'Asia/Bahrain',
    'Europe/Athens',
    'Europe/Bucharest',
    'Africa/Cairo',
    'Europe/Helsinki',
    'Europe/Istanbul',
    'Asia/Jerusalem',
    'Asia/Kuwait',
    'Europe/Moscow',
    'Asia/Nicosia',
    'Asia/Qatar',
    'Europe/Riga',
  ],
  4: ['Asia/Dubai'],
  5: ['Asia/Karachi'],
  6: ['Asia/Almaty'],
  6.5: ['Asia/Yangon'],
  7: ['Asia/Bangkok'],
  8: ['Asia/Chongqing'],
  9: ['Asia/Tokyo'],
  9.5: ['Australia/Adelaide'],
  10: ['Australia/Brisbane'],
  11: ['Pacific/Norfolk'],
  12.75: ['Pacific/Chatham'],
};

const Chart = (props) => {
  const { symbol, pair, isTokenFirst, interval } = props;
  const offset = (-1 * new Date().getTimezoneOffset())/60;

  useEffect(() => {
    if (symbol && interval) {
      // eslint-disable-next-line no-undef
      const widget = (window.tvWidget = new TradingView.widget({
        symbol: symbol,
        interval: interval,
        fullscreen: false,
        width: "100%",
        height: "100%",
        borderRadius: "10px",
        container_id: 'tv_chart_container',
        datafeed: Datafeed_v2(pair.toLowerCase(), isTokenFirst),
        library_path: '/charting_library/',
        toolbar_bg: '#0b1217',
        overrides: {
          'paneProperties.rightMargin': 0,
          'paneProperties.background': '#0b1217',
          'paneProperties.backgroundType': 'gradient',
          'paneProperties.backgroundGradientEndColor': '#0b1217',
          'paneProperties.backgroundGradientStartColor': '#0b1217',
          'mainSeriesProperties.candleStyle.upColor': '#089981', // Up Candle Color
          'mainSeriesProperties.candleStyle.downColor': '#f23645', // Down Candle Color
          'mainSeriesProperties.candleStyle.borderUpColor': '#089981', // Up Candle Border Color
          'mainSeriesProperties.candleStyle.borderDownColor': '#f23645', // Down Candle Border Color
          'mainSeriesProperties.candleStyle.drawBorder': false, // Disable candle borders
          'mainSeriesProperties.minTick': '100000000,1,false',
          "scalesProperties.textSize": 18,
          "scalesProperties.showLeftScale": false,
        },
        loading_screen: {
          backgroundColor: "#fff",
        },
        disabled_features: ['header_symbol_search'],
        time_frames: [],
        theme: 'Dark',
        timezone: TIMEZONE[offset][0],
      }));

      widget.onChartReady(async () => {
        widget.activeChart().setTimezone('UTC');
      });
    }
  }, [symbol, interval]);
  return (
    <div id="tv_chart_container" className='h-full !rounded-md'/>
  );
};

export default Chart;