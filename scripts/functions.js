'use strict';

const snackbar = document.getElementById("snackbar");
const protocol = "https://"
const domain = "api.micronear.berrykingdom.xyz";
//const domain = "127.0.0.1:3001";


export const errors = {
    generic: "An error occured",
    location: "Couldn't access device location",
    fetch: "Couldn't fetch the resources",
    add_internal_fault: "An internal error occured",
    terms: "Agree to the terms in order to proceed",
    micronaiton_not_found: "Couldn't fetch data about this micronation"
}

export function showSnackBar(message) {
    if(snackbar.MaterialSnackbar != undefined) {
        snackbar.MaterialSnackbar.showSnackbar({message: message});
    } else {
        window.setTimeout(showSnackBar, 100, message);
    }
}

export function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

export function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

export function geoPermission() {

    return new Promise(function(resolve, reject) {

        navigator.permissions.query({name: 'geolocation'})
        .then(function(PermissionStatus) {
            if (PermissionStatus.state == 'granted') {
                resolve(true);
            }else {
                resolve(false);
            }
        })
    });

}

export function observeGeoPermission() {
    navigator.permissions.query({name:'geolocation'}).then(function(result) {
        alert(result);
      result.onchange = function() {
        alert(result.change);
        if(result.state == "granted") {
            window.location = "/index.html";
        }
      }
    });
}

export async function sendAddRequest (micronation) {

    if(await geoPermission() == true) {
        let geolocation = await geoData(true);

        micronation.coordinates = geolocation;

        let parsedmicronation = JSON.stringify(micronation);
        let url = `${protocol}${domain}/add`;
        
        await superfetch(url, "POST", parsedmicronation, (data) => {
            console.log(data);

            if(data.success == true) {

            } else {
                showSnackBar(errors.add_internal_fault)
            }

            }, (error) => {
                showSnackBar(errors.fetch)
                console.log(error);
            }
        );

    } else {
        showSnackBar(errors.location);
    }

}

export async function sendFindRequest () {

    let foundresults = document.querySelector("#found__results");

    if(await geoPermission() == true) {
        
        let geolocation = await geoData();

    foundresults.innerHTML = `<div id="p2" class="mdl-progress mdl-js-progress mdl-progress__indeterminate"></div>`;

    let url = `${protocol}${domain}/find`;

    await superfetch(url, "POST", geolocation, (data) => {

        let wrapper = document.createElement("div");
        if(data.length == 0) {
            wrapper.innerHTML += `<p>We couldn't find any micronations near you, would you like to <a href="/add.html">add your own micronation</a>?</p>`;
        }
        data.forEach(micronation => {
            let card = `
<div class="card mdl-card mdl-shadow--2dp" style="background-image: linear-gradient(to bottom, rgb(255 255 255 / 85%), rgb(18 50 66 / 85%)), url('${micronation.splash}')">

  <div class="mdl-card__title">
    <h2 class="mdl-card__title-text">${micronation.name}</h2>
  </div>
  <div class="mdl-card__supporting-text">
    ${micronation.description}
  </div>

    <div class="mdl-card__actions mdl-card--border">
        <a href="micronation.html?m=${micronation.imnc}" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">
            More
        </a>
        <span>${round(micronation.proximity, 1)}km</span>
    </div>

  <div class="mdl-card__menu">
    <button class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect">
        <i class="material-icons">${(micronation.verified) ? "verified" : null}</i>
    </button>
  </div>
</div>
            
            `;
            wrapper.innerHTML += card;
        });
        foundresults.innerHTML = null;
        found__results.appendChild(wrapper);



    }, (error) => {
        showSnackBar(errors.fetch);
        console.log(error);
    })



    } else {
        showSnackBar(errors.location);
    }
    
}

export async function sendListRequest() {


    let url = `${protocol}${domain}/micronations`;


    let wrapper = document.getElementById("list__ul");
    wrapper.innerHTML = null;

    await superfetch(url, "GET", null, (data) => {
        console.log(data);

        if(Object.values(data).length == 0) {
            wrapper.innerHTML += "<p>The server couldn't provide any micronations</p>"
        }

        Object.values(data).forEach(micronation => {

            let listitem = `
            <li class="mdl-list__item mdl-list__item--three-line">
                <span class="mdl-list__item-primary-content">
                    <span>${micronation.imnc}</span>
                    <span class="mdl-list__item-text-body">
                        ${micronation.name}
                    </span>
                </span>
                <span class="mdl-list__item-secondary-content">
                    <i class="material-icons">${(micronation.verified) ? "verified" : null}</i>
                </span>
                <span class="mdl-list__item-secondary-content">
                    <a href="micronation.html?m=${micronation.imnc}">
                        <i class="material-icons">open_in_new</i>
                    </a>
                </span>
            </li>
        `;
        wrapper.innerHTML += listitem;
        });

    }, (error) => {
        showSnackBar(errors.fetch)
        console.log(error);
    })



}

export async function geoData (enableHighAccuracy) {

    const options = {
        enableHighAccuracy: enableHighAccuracy
    }

    return new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition((location) => {

            let latitude = location.coords.latitude;
            let longitude = location.coords.longitude;
            let accuracy = location.coords.accuracy;

            let data = {
                "latitude": latitude,
                "longitude": longitude,
                "accuracy": accuracy
            }
            resolve(data);
        }, (error) => {
            console.log(error)
        }, options);
    });
    
}

export async function superfetch(url, method, body, datahandler, errorhandler) {

    body = JSON.stringify(body);

    const options = {
        method: method,
        type: "cors"
    }

    if(method != "GET") {
        options.body = body;
    }

    fetch(url, options)
    .then((response) => {
        return response.json();
    }).then(data => datahandler(data))
    .catch(error => errorhandler(error)
    )
}

export async function sendInfoRequest(imnc) {
    
    let url = `${protocol}${domain}/micronation/${imnc}`;
    
    await superfetch(url, "GET", null, (data) => {
        console.log(data);

    }, (error) => {
        showSnackBar(errors.fetch)

    })

}