# Unofficial Tado API

This a javascript module based on https://shkspr.mobi/blog/2019/02/tado-api-guide-updated-for-2019/

## Installation

̀```bash
npm install tado-api-unofficial
```

## Requirements

### Proxy

Because the Tado resources are not available in javascript from the browser (due to CORS), then I've had to set up a proxy page that will receive my requests and transfer them to Tado.

I'll explain what I did with an Apache server and PHP.

Two files are required: `.htaccess` and [`proxy.php`](proxy.php)

The `.htaccess` file must be placed in the same folder as `proxy.php`. Here is its content:
```
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "POST, GET, OPTIONS, DELETE, PUT"
Header always set Access-Control-Allow-Headers "*"

RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

```

The purpose of this file is to allow CORS requests.

Next you have to use [`proxy.php`](proxy.php): this file will only allow request to `https://auth.tado.com/` and `https://my.tado.com/`.

### Tado Client Secret

The current Tado Client Secret is: **wZaRN7rpjn3FoNyF5IFuxg9uMzYJcvOoQ8QWiIqS3hfk6gLhVlG57j5YNoZL2Rtc**

This value should not change often, but in case it happens, you can find it by checking the page https://my.tado.com/webapp/env.js, or you can also point your browser to https://my.tado.com/webapp/ and look at the developer console to find it.

## How to use

```javascript
const Tado = require('tado-api-unofficial')

// OR:
// import Tado from 'tado-api-unofficial'

// you need to provide a configuration
const tado = new Tado({
  "client-secret": "wZaRN7rpjn3FoNyF5IFuxg9uMzYJcvOoQ8QWiIqS3hfk6gLhVlG57j5YNoZL2Rtc", // the one explained in the above section
  "username": "user@example.com", // the email you use to connect to your account
  "password": "P@ssword", // the password associated to your account
  "proxy": "https://my.host.com/proxy.php" // the proxy.php file explained in the above section
})
```

## API

Once you have initiated your object, you can use the below API:

### `.getProfile()`

To return the details about your profile.

̀```javascript
tado.getProfile()
.then(function(profile) {
  console.log(profile);
})
```

It will return something like:
```json
{
  "id":12345,
  "name":"My Home",
  "dateTimeZone":"Europe/Paris",
  "dateCreated":"2019-12-07T14:51:39.353Z",
  "temperatureUnit":"CELSIUS",
  "partner":null,
  "simpleSmartScheduleEnabled":true,
  "awayRadiusInMeters":400.00,
  "installationCompleted":true,
  "skills":[],
  "christmasModeEnabled":true,
  "showAutoAssistReminders":true,
  "contactDetails":{
    "name":"Aymeric",
    "email":"aymeric@example.com",
    "phone":"+3301020304"
  },
  "address":{
    "addressLine1":"Paradise Street",
    "addressLine2":"",
    "zipCode":"99999",
    "city":"Rainbow",
    "state":null,
  "country":"FRA"
  },
  "geolocation":{
    "latitude":4.5,
    "longitude":39.848
  },
  "consentGrantSkippable":true
}
```

### `.getDevices()`

To return the list of your devices.

```javascript
tado.getDevices()
.then(function(devices) {
  console.log(devices);
})
```

It will return something like:
```json
[
  {
    "id":1,
    "name":"Climatisation",
    "type":"AIR_CONDITIONING",
    "dateCreated":"2019-12-07T14:59:25.320Z",
    "deviceTypes":["WR02"],
    "devices":[
      {
        "deviceType":"WR02",
        "serialNo":"WR22921216976",
        "shortSerialNo":"WR22921216976",
        "currentFwVersion":"59.4",
        "connectionState":{
          "value":true,
          "timestamp":"2020-02-17T17:39:11.767Z"
        },
        "characteristics":{
          "capabilities":["INSIDE_TEMPERATURE_MEASUREMENT", "IDENTIFY"]
        },
        "accessPointWiFi":{
          "ssid":"tado66"
        },
        "commandTableUploadState":"FINISHED",
        "duties":["ZONE_UI", "ZONE_DRIVER", "ZONE_LEADER"]
      }
    ],
    "reportAvailable":false,
    "supportsDazzle":true,
    "dazzleEnabled":true,
    "dazzleMode":{
      "supported":true,
      "enabled":true
    },
    "openWindowDetection":{
      "supported":true,
      "enabled":true,
      "timeoutInSeconds":900
    }
  }
]
```

### `.getDevice(deviceId)`

It will return the info for a specific device.

```javascript
tado.getDevice(deviceId)
.then(function(deviceInfo) {
  console.log(deviceInfo);
})
```

It will return something like:
```json
{
  "tadoMode":"HOME",
  "geolocationOverride":false,
  "geolocationOverrideDisableTime":null,
  "preparation":null,
  "setting":{
    "type":"AIR_CONDITIONING",
    "power":"ON",
    "mode":"HEAT",
    "temperature":{
      "celsius":20.00,
      "fahrenheit":68.00
    },
    "fanSpeed":"AUTO"
  },
  "overlayType":null,
  "overlay":null,
  "openWindow":null,
  "nextScheduleChange":{
    "start":"2020-02-17T23:00:00Z",
    "setting":{
      "type":"AIR_CONDITIONING",
      "power":"OFF"
    }
  },
  "nextTimeBlock":{
    "start":"2020-02-17T23:00:00.000Z"
  },
  "link":{
    "state":"ONLINE"
  },
  "activityDataPoints":{
    "acPower":{
      "timestamp":"2020-02-17T16:29:07.591Z",
      "type":"POWER",
      "value":"ON"
    }
  },
  "sensorDataPoints":{
    "insideTemperature":{
      "celsius":20.77,
      "fahrenheit":69.39,
      "timestamp":"2020-02-17T17:50:05.811Z",
      "type":"TEMPERATURE",
      "precision":{
        "celsius":0.1,
        "fahrenheit":0.1
      }
    },
    "humidity":{
      "type":"PERCENTAGE",
      "percentage":67.60,
      "timestamp":"2020-02-17T17:50:05.811Z"
    }
  }
}
```

### `.getPresence()`

It will tell if you're at home ("presence" equals to "HOME") or not.

```javascript
tado.getPresence()
.then(function(ret) {
  if (ret.presence === "HOME") {
    console.log("At home!");
  }
})
```

### `.getWeather()`

Return info about the area weather.

```javascript
tado.getWeather()
.then(function(weather) {
  console.log(weather);
})
```

It will return something like:
```json
{
  "solarIntensity":{
    "type":"PERCENTAGE",
    "percentage":0.00,
    "timestamp":"2020-02-17T17:59:48.840Z"
  },
  "outsideTemperature":{
    "celsius":12.82,
    "fahrenheit":55.08,
    "timestamp":"2020-02-17T17:59:48.840Z",
    "type":"TEMPERATURE",
    "precision":{
      "celsius":0.01,
      "fahrenheit":0.01
    }
  },
  "weatherState":{
    "type":"WEATHER_STATE",
    "value":"NIGHT_CLOUDY",
    "timestamp":"2020-02-17T17:59:48.840Z"
  }
}
```

### `.setDevice(deviceId, setting)`

Permit to define a setting for a device.

```javascript
tado.setDevice(deviceId, setting)
.then(function(ret) {
  console.log(ret);
})
```

The `setting` parameter must be similar to what you get in the `setting` section of your device when using `.getDevice()`.

Examples:
  - to stop infinitely an AC device: `{"setting":{"type":"AIR_CONDITIONING","power":"OFF"}}`
  - to start an AC device with 21°C in Heat mode: `{"setting":{"type":"AIR_CONDITIONING","power":"ON","mode":"HEAT","fanSpeed":"AUTO","temperature":{"celsius": 21}}}`

### `.resetDevice(deviceId)`

Stop the manual mode and reset to the automatic setting.

```javascript
tado.resetDevice(deviceId)
.then(function(ret) {
  console.log(ret);
})
```

### `.getEndPoint(url, [params])`

For any other requests, you can use this function.

**Note**: you can use `%homeId%` in the URL and it will automatically be replaced by your Home Id.

If `params` is provided and is a JSON object, then a `POST` request is sent with `params` as the body.
If `params` is provided and equals to "DELETE", then a `DELETE` request is sent.

Examples:
```javascript
tado.getEndPoint("https://my.tado.com/api/v2/homes/%homeId%"); // equivalent of tado.getProfile()
tado.getEndPoint("https://my.tado.com/api/v2/homes/%homeId%/zones/"+deviceId+"/overlay", {"setting":{"type":"AIR_CONDITIONING","power":"OFF"}}); // equivalent to tado.setDevice(deviceId, setting)
tado.getEndPoint("https://my.tado.com/api/v2/homes/%homeId%/zones/"+deviceId+"/overlay", 'DELETE'); // equivalent to tado.resetDevice(deviceId)
```
