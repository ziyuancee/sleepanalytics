"use strict";
// var username = "lamhokpui";
// var apiKey = "aio_JXhp38CWoUtqJbHU1GZFMfrvyPG7";
var username = "zching1";
var apiKey = "aio_sYOP22FK67fgftFAjvhaPlW05jC3";
var submit = document.getElementById("submit");
var lineChart = null;
var timeSlept = document.getElementById("timeSlept");
formsubmit.addEventListener("click", function() {
    const start = document.getElementById("start").value;
    const resolution = document.getElementById("resolution").value;
    chart(start, resolution);
});

/*
chart -- the megafunction that fetches data from adafruit, converts it to chart.js data, makes a table, all of which is then displayed on the page
start: start date
resolution: daily/weekly (this matters because we have to process data differently depending on the type of graph)
*/
function chart(start, resolution) {
    var startDate = new Date(start).toISOString();

    if (resolution == "daily") {
        var endDate = new Date(moment(startDate).add(1, 'days')).toISOString();
        var resValue = 10;
    } else if (resolution == "weekly") {
        var endDate = new Date(moment(startDate).add(7, 'days')).toISOString();
        var resValue = 10;
    }
    var url = 'https://io.adafruit.com/api/v2/' + username + '/feeds/visible/data/chart?start_time=' + startDate + '&end_time=' + endDate + '&resolution=' + resValue + '&field=avg';
    fetch(url, {
            headers: {
                'X-AIO-Key': apiKey
            }
        }).then(response => {
            if (response.ok) return response.json();
        })
        .then((body) => {
            if (body != null) {
                console.log(body.data);
                const points = adafruitToChart(body.data, start, resolution);
                console.log("points = ");
                console.log(points)
                var canvas = document.getElementById('chart');
                var charttype = document.getElementById('charttype');
                console.log("charttype");
                console.log(charttype.value);
                var ctx = canvas.getContext('2d');
                if (lineChart != null) lineChart.destroy();

                if (resolution == "daily") {
                    console.log("line and daily")
                    lineChart = makeChart(ctx, points, "Minutes", "Light Detected?", String(charttype.value));
                } else if (resolution == "weekly") {
                    lineChart = makeChart(ctx, points, "Minutes", "Minutes", String(charttype.value));
                } else if (resolution == "bubble") {
                    console.log("bubble")
                    lineChart = makeScatterChart(ctx, points);
                    console.log(points)
                }
                displayTable(body.data);
            }
        });
}
/*
adafruitToChart -- converts adafruit data to chart.js data, as adafruit data comes in a json but chart.js wants a dictionary of (x,y) points
array: data pulled from adafruit
start: start date
resolution: daily/weekly (this matters because we have to process data differently depending on the type of graph)
*/
function adafruitToChart(array, start, resolution) {
    var adafruitPoints = [];
    var minsSlept = 0;
    var minsSleptWeekly = 0;
    var daysPassed = 0;
    var startDate = start;


    //process adafruit data as well as amount of time slept
    for (let i = 0; i < array.length - 1; i++) {
        if (resolution == "daily") {
            minsSlept = minsSlept + ((1 - (array[i])[1]) * 10);
            const chartPoints = {
                x: (array[i])[0],
                y: (array[i])[1]
            }
            adafruitPoints.push(chartPoints);
        } else if (resolution == "weekly") {
            //takes the previous datapoint for comparison purposes
            if (i != 0) {
                var prev = new Date((array[i - 1])[0]).getDay();
            }
            var curr = new Date((array[i])[0]).getDay();
            minsSlept = minsSlept + ((1 - (array[i])[1]) * 10);
            //if the day changes, we add the datapoint to the chart
            //alternatively, if we are at the end of the array, we add the datapoint to the chart
            if ((prev != curr && i != 0) || (i == array.length - 2)) {
                const chartPoints = {
                    x: new Date(moment(startDate).add(daysPassed, 'days').format("LL")),
                    y: minsSlept
                }
                daysPassed = daysPassed + 1;
                adafruitPoints.push(chartPoints);
                minsSleptWeekly += minsSlept;
                //reset minsSlept for the next day
                minsSlept = 0;
            }

        }
    }


    if (resolution == "daily") {
        console.log(minsSlept)
        minsSlept = Math.round(minsSlept);
        var hoursSlept = minsSlept - (minsSlept % 60);
        timeSlept.innerHTML = "You slept for " + String(hoursSlept / 60) + " hours and " + String(minsSlept - hoursSlept) + " minutes on this day.";
    } else if (resolution == "weekly") {
        minsSleptWeekly = Math.round(minsSleptWeekly);
        var hoursSlept = minsSleptWeekly - (minsSleptWeekly % 60);
        timeSlept.innerHTML = "You slept for " + String(hoursSlept / 60) + " hours and " + String(minsSleptWeekly - hoursSlept) + " minutes on this week.";
    }
    return adafruitPoints;
}
/*
displayTable -- converts adafruit data to a tabular representation to show when the user slept thorughout the day/week
array: data pulled from adafruit
*/
function displayTable(array) {
    var table = document.getElementById("table");
    //reset table on each call otherwise we'll have residual data from previous calls
    while (table.rows.length > 0) {
        table.deleteRow(0);
    }
    var tableRow = table.insertRow(0);
    var header1 = tableRow.insertCell(0);
    header1.innerHTML = "Start of Sleep";
    var header2 = tableRow.insertCell(1);
    header2.innerHTML = "End of Sleep";
    var header3 = tableRow.insertCell(2);
    header3.innerHTML = "Minutes Slept";
    var row = 1


    for (let i = 0; i < array.length - 1; i++) {
        var minsSleptTable = 0;
        if (array[i][1] != 1) {
            var tableRow = table.insertRow(row);
            var cell1 = tableRow.insertCell(0);
            var startSleep = moment((array[i])[0]);
            cell1.innerHTML = startSleep.format('MMMM Do YYYY, h:mm:ss a').toString();
            minsSleptTable = minsSleptTable + ((1 - (array[i])[1]) * 10);

            //second loop iterates over the rest of the array to find the end of the user's sleep
            for (let j = i + 1; j < array.length - 1; j++) {

                minsSleptTable = minsSleptTable + ((1 - (array[j])[1]) * 10);
                //if we find the end of the user's sleep, we add the data to the table and break out of the loop
                if (array[j][1] == 1) {
                    var endSleep = moment((array[j])[0]);
                    var cell2 = tableRow.insertCell(1);
                    cell2.innerHTML = endSleep.format('MMMM Do YYYY, h:mm:ss a').toString();
                    var cell3 = tableRow.insertCell(2);
                    minsSleptTable = Math.round(minsSleptTable);
                    var hoursSlept = minsSleptTable - (minsSleptTable % 60);
                    cell3.innerHTML = String(hoursSlept / 60) + "h " + String(minsSleptTable - hoursSlept) + "m";
                    //set i to j so we don't iterate over the same data again
                    i = j;
                    row++;
                    break;
                }

            }
        }


    }
}
/*
makeChart -- creates a chart.js chart
ctx: the canvas element
data: the data to be displayed on the chart (in chart.js format)
ylabel: the label for the y axis
type: the type of chart to be displayed
*/
function makeChart(ctx, data, ylabel, yaxis, type) {
    const config = {
        type: type,
        data: {
            datasets: [{
                data: data,
                label: ylabel,
                fill: false
            }]
        },
        options: {
            scales: {
                xAxis: {
                    type: 'time',
                },
                y: {
                    title: {
                        display: true,
                        text: yaxis
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            }
        }
    };
    return new Chart(ctx, config);
}

/*
makeScatterChart -- creates a scatter chart
ctx: the canvas element
data: the data to be displayed on the chart (in chart.js format)
ylabel: the label for the y axis
type: the type of chart to be displayed
*/

function makeScatterChart(ctx, data, ylabel, type) {
    const config = {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Scatter Dataset',
                data: data,
                backgroundColor: 'rgb(255, 99, 132)'
            }],
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom'
                }
            }
        }
    };
    return new Chart(ctx, config);
}