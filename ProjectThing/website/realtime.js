"use strict";

// var username = "lamhokpui";
// var apiKey = "aio_JXhp38CWoUtqJbHU1GZFMfrvyPG7";
var username = "zching1";
var apiKey = "aio_sYOP22FK67fgftFAjvhaPlW05jC3";
display("ir")
display("lum")
display("visible")


/*
display -- repeatedly calls fetch_from_API to display the most recent value from the feed called using promises
            we use promises here because of its asynchronous nature; we want to update 3 elements separately and not have them fail
            when one of them fails
feed: the feed that we're reading information from
*/
async function display(feed) {
    //from https://stackoverflow.com/questions/8682622/using-setinterval-to-do-simplistic-continuous-polling

    var sleep = duration => new Promise(resolve => setTimeout(resolve, duration))

    var poll = (promiseFn, duration) => promiseFn().then(
        sleep(duration).then(() => poll(promiseFn, duration))).then(result => result);

    poll(() => new Promise(() => fetch_from_API(feed)), 5000)
}

/*
fetch_from_API -- fetches and displays the most recent value from the feed called
feed: the feed that we're reading information from
*/

async function fetch_from_API(feed) {
    let url = 'https://io.adafruit.com/api/v2/' + username + '/feeds/' + feed + '/data?limit=1'

    if (feed == "ir") {
        var div = document.getElementById("ir_log")
    } else if (feed == "lum") {
        var div = document.getElementById("lum_log")
    } else if (feed == "visible") {
        var div = document.getElementById("vis_log")
    }
    fetch(url, {
            method: 'GET',
            headers: {
                'X-AIO-Key': apiKey,
                'Accept': 'application/json',
            },
        })
        .then(response => response.json())
        .then(response => {
            div.innerHTML = response[0].value;
        })
}