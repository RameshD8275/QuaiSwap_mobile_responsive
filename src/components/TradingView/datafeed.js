import axios from "../../util/axios";
import { ChartStatus } from "../../constant/constant";
import Config from "../../util/config";

const resValues = {
    // minutes
    1: 1,
    5: 5,
    15: 15,
    30: 30,
    45: 45,
    60: 60,
    120: 120,
    240: 240,
    "1D": 1440,
    "1W": 10080,
    "1M": 70560
};

export const configurationData = {
    supported_resolutions: ["1", "5", "15", "30", "45", "60", "120", "240", "D", "W", "M"],
};

function convertTimestamp(timestamp) {
    var d = new Date(timestamp * 1000), // Convert the passed timestamp to milliseconds
        yyyy = d.getFullYear(),
        mm = ("0" + (d.getMonth() + 1)).slice(-2), // Months are zero based. Add leading 0.
        dd = ("0" + d.getDate()).slice(-2), // Add leading 0.
        hh = d.getHours(),
        h = hh,
        min = ("0" + d.getMinutes()).slice(-2), // Add leading 0.
        ampm = "AM",
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = "PM";
    } else if (hh === 12) {
        h = 12;
        ampm = "PM";
    } else if (hh === 0) {
        h = 12;
    }
    time = yyyy + "-" + mm + "-" + dd + ", " + h + ":" + min + " " + ampm;
    return time;
}

const datafeed = (pair, isTokenFirst) => {
    let Socket = new WebSocket(Config.backend_WS_URL)
    Socket.onopen = () => {
    }
    Socket.onclose = () => {
    }
    let timestamp = new Map();
    let firstTimestamp = {};
    let latestBar;
    let cur_resolution = 1;
    let cntForDailyorWeekly = {};
    return {
        onReady: (callback) => {
            // console.log('[Test]onReady-setTimout')
            setTimeout(() => callback(configurationData));
        },
        searchSymbols: async () => {
            // console.log('[Test]searchSymbol')
        },
        resolveSymbol: async (
            symbolName,
            onSymbolResolvedCallback,
            onResolveErrorCallback
        ) => {
            // console.log('[Test]resolveSymbol')
            let symbolInfo = {
                name: symbolName,
                has_intraday: true,
                has_no_volume: false,
                session: "24x7",
                timezone: "Europe/Athens",
                exchange: "QuaiSwap",
                minmov: 0.00000001,
                pricescale: 100000000,
                has_weekly_and_monthly: true,
                volume_precision: 8,
                data_status: "streaming",
                supported_resolutions: configurationData.supported_resolutions,
            };
            onSymbolResolvedCallback(symbolInfo);
        },

        getBars: async (
            symbolInfo,
            resolution,
            periodParams,
            onHistoryCallback,
            onErrorCallback,
            // firstDataRequest
        ) => {
            const { from, to, firstDataRequest } = periodParams;
            const resVal = resValues[resolution];

            try {
                let response;
                if (pair !== undefined && pair !== "0x0000000000000000000000000000000000000000") {
                    const priceDTO = {
                        pair: pair,
                        from: from,
                        to: to,
                        interval: resVal,
                        firstRequest: firstDataRequest
                    }

                    const priceData = await axios.post(Config.backend_HTTP_URL, priceDTO)

                    if (priceData.status !== 200) {
                        onHistoryCallback([], { noData: false });
                        return;
                    }

                    response = priceData.data.data.data

                    if (!response.length) {
                        onHistoryCallback([], { noData: true })
                    }

                    if (response && response != undefined && response.length > 0) {
                        // console.log('[Nightfury-response]', response)
                        let bars = response.map((data) => {
                            let date = new Date(data.time)
                            return {
                                time: date.getTime(),
                                low: isTokenFirst === ChartStatus.isSecondToken ? data.low : (data.low === 0 ? 0 : Number(1 / data.low)),
                                high: isTokenFirst === ChartStatus.isSecondToken ? data.high : (data.high === 0 ? 0 : Number(1 / data.high)),
                                open: isTokenFirst === ChartStatus.isSecondToken ? data.open : (data.open === 0 ? 0 : Number(1 / data.open)),
                                close: isTokenFirst === ChartStatus.isSecondToken ? data.close : (data.close === 0 ? 0 : Number(1 / data.close)),
                                volume: data.volumeUsd,
                            };
                        });
                        bars = bars.sort(function (a, b) {
                            if (a.time < b.time) return -1;
                            else if (a.time > b.time) return 1;
                            return 0;
                        });

                        if (bars.length > 0)
                            latestBar = bars[bars.length - 1];
                        window.delta = 0;
                        // console.log('getBar-latestBar', latestBar)
                        onHistoryCallback(bars, { noData: false });
                    }

                }
            }
            catch (error) {
                onErrorCallback(error);
            }
        },
        subscribeBars: (
            symbolInfo,
            resolution,
            onRealtimeCallback,
            subscribeUID,
            onResetCacheNeededCallback,
        ) => {
            try {
                timestamp.set(subscribeUID, Date.now())
                const resVal = resValues[resolution];
                if (Socket.readyState === WebSocket.OPEN)
                    Socket.send(JSON.stringify({
                        event: "SUBSCRIBE_PRICE_CHART",
                        data: {
                            subId: subscribeUID,
                            pairAddress: pair,
                            interval: resVal,
                            timestamp: timestamp.get(subscribeUID)
                        }
                    }));


                // console.log('Websocket connected😊', pair, subscribeUID, timestamp.get(subscribeUID), resVal)

                Socket.onmessage = (event) => {
                    // console.log('webSocket message = ', event)
                    const res = JSON.parse(event.data)

                    if (res && res.event == "PRICE_DATA") {
                        // console.log('====== PRICE_CHART ========', res.data)
                        const time = new Date(res.data.time)
                        let newBar = {
                            time: time.getTime(),
                            low: isTokenFirst === ChartStatus.isSecondToken ? res.data.low : (res.data.low === 0 ? 0 : Number(1 / res.data.low)),
                            high: isTokenFirst === ChartStatus.isSecondToken ? res.data.high : (res.data.high === 0 ? 0 : Number(1 / res.data.high)),
                            open: isTokenFirst === ChartStatus.isSecondToken ? res.data.open : (res.data.open === 0 ? 0 : Number(1 / res.data.open)),
                            close: isTokenFirst === ChartStatus.isSecondToken ? res.data.close : (res.data.close === 0 ? 0 : Number(1 / res.data.close)),
                            volume: res.data.volumeUsd,
                        };
                        if (latestBar != undefined) {

                            const nextTime = latestBar.time + resVal * 60 * 1000;
                            // console.log('night-time', 'lasttime', latestBar.time, 'nextTime', nextTime, 'res', res.data.time, 'now', Date.now(), 'latestBar', latestBar)
                            if (nextTime <= newBar.time) newBar.open = latestBar.close;
                            else {
                                newBar.open = latestBar.open;
                            }
                        }
                        // console.log('night-newBar', newBar, latestBar)
                        latestBar = newBar;
                        onRealtimeCallback(newBar);
                    }
                };
            }
            catch (e) {
                console.log(e)
            }
        },
        unsubscribeBars: (subscribeUID) => {
            const resolution = subscribeUID.split("_").pop();
            const resVal = resValues[resolution]
            // console.log('unsubscribe', resVal, resolution)
            if (Socket.readyState === WebSocket.OPEN)
                Socket.send(JSON.stringify({
                    event: "UNSUBSCRIBE_PRICE_CHART",
                    data: {
                        subId: subscribeUID,
                        pairAddress: pair,
                        interval: resVal,
                        timestamp: timestamp.get(subscribeUID)
                    }
                }))
            // console.log('Websocket disconnected😒', pair, subscribeUID, timestamp.get(subscribeUID), resVal)

        },
    };
};
export default datafeed;