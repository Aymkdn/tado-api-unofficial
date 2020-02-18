// source: https://stackoverflow.com/questions/14525178/is-there-any-native-function-to-convert-json-to-url-parameters/40287849
function toUriParameters(data) {
  var url = '';
  for (var prop in data) {
    url += encodeURIComponent(prop) + '=' + encodeURIComponent(data[prop]) + '&';
  }
  return url.substring(0, url.length - 1)
}

function Tado (tadoConf) {
  this.tadoConf = tadoConf;
  // various information we need to talk with Tado API
  this.auth = {
    access_token:"",
    expire_at:new Date(2020,0,1),
    homeId:""
  }

  /**
   * It will get the Access Token from Tado
   *
   * @return {String} access_token
   */
  this.getAccessToken = function() {
    // check if the token we have is still OK
    var now = new Date();
    if (now < this.auth.expire_at) return Promise.resolve(this.auth.access_token);

    var _this = this;
    var formData = toUriParameters({
      'username': this.tadoConf.username,
      'password': this.tadoConf.password,
      'client_id': 'tado-web-app',
      'grant_type': 'password',
      'scope': 'home.user',
      'client_secret': this.tadoConf['client-secret']
    });

    return window.fetch("https://auth.tado.com/oauth/token", {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })
    .then(function(response) {
      return response.json()
    })
    .then(function(data) {
      // we need the access_token
      // and the expiration
      var date = new Date();
      date.setSeconds(date.getSeconds() + data.expires_in);
      _this.auth.access_token = data.access_token;
      _this.auth.expire_at = date;

      return data.access_token;
    })
  }

  /**
   * Return the Home Id
   *
   * @return {String} homeId
   */
  this.getHomeId = function () {
    if (this.auth.homeId) return Promise.resolve(this.auth.homeId);

    var _this=this;
    return this.getAccessToken()
    .then(function(access_token) {
      return window.fetch(_this.tadoConf.proxy+"?url="+encodeURIComponent("https://my.tado.com/api/v1/me"), {
        mode: 'cors',
        headers:{
          'Authorization': 'Bearer '+access_token
        }
      })
    })
    .then(function(response) {
      return response.json()
    })
    .then(function(data) {
      _this.auth.homeId = data.homeId;

      return data.homeId;
    })
  }

  /**
   * It will get the required Auth details and execute a request against the provided URL
   *
   * @param  {String} url The URL to reach (if the URL contains "%homeId%" then it will replace with the correct value)
   * @param  {Object|String} [params] If we want to put data, then we have to provide the `params`… To sent a DELETE instead of a PUT, we'll use 'DELETE' for `params`
   * @return {JSON}     the data returned
   */
  this.getEndPoint = function (url, params) {
    var _this = this;
    return this.getAccessToken()
    .then(function() {
      return _this.getHomeId()
    })
    .then(function() {
      var settings = {
        mode: 'cors',
        headers:{
          'Authorization': 'Bearer '+_this.auth.access_token
        }
      }

      // if ̀`params` is provided, then change a few things
      if (params) {
        if (params === 'DELETE') settings.method = "DELETE";
        else {
          settings.method = "PUT";
          settings.headers["Content-Type"] = "application/json;charset=utf-8";
          settings.body = JSON.stringify(params);
        }
      }

      return window.fetch(_this.tadoConf.proxy+"?url="+encodeURIComponent(url.replace(/%homeId%/g,_this.auth.homeId)), settings)
    })
    .then(function(response) {
      return (params === 'DELETE' ? '' : response.json());
    })
    .then(function(data) {
      return data;
    })
  }
  /**
   * Return your Tado profile details
   *
   * @return {Object}
   *
   * example of what is returned: {"id":12345,"name":"My Home","dateTimeZone":"Europe/Paris","dateCreated":"2019-12-07T14:51:39.353Z","temperatureUnit":"CELSIUS","partner":null,"simpleSmartScheduleEnabled":true,"awayRadiusInMeters":400.00,"installationCompleted":true,"skills":[],"christmasModeEnabled":true,"showAutoAssistReminders":true,"contactDetails":{"name":"Aymeric","email":"aymeric@example.com","phone":"+3301020304"},"address":{"addressLine1":"Paradise Street","addressLine2":"","zipCode":"99999","city":"Rainbow","state":null,"country":"FRA"},"geolocation":{"latitude":4.5,"longitude":39.848},"consentGrantSkippable":true}
   */
  this.getProfile = function () {
    return this.getEndPoint("https://my.tado.com/api/v2/homes/%homeId%");
  }

  /**
   * Return your devices
   *
   * @return {Array} array of objects
   *
   * example of what is returned: [{"id":1,"name":"Climatisation","type":"AIR_CONDITIONING","dateCreated":"2019-12-07T14:59:25.320Z","deviceTypes":["WR02"],"devices":[{"deviceType":"WR02","serialNo":"WR22921216976","shortSerialNo":"WR22921216976","currentFwVersion":"59.4","connectionState":{"value":true,"timestamp":"2020-02-17T17:39:11.767Z"},"characteristics":{"capabilities":["INSIDE_TEMPERATURE_MEASUREMENT","IDENTIFY"]},"accessPointWiFi":{"ssid":"tado66"},"commandTableUploadState":"FINISHED","duties":["ZONE_UI","ZONE_DRIVER","ZONE_LEADER"]}],"reportAvailable":false,"supportsDazzle":true,"dazzleEnabled":true,"dazzleMode":{"supported":true,"enabled":true},"openWindowDetection":{"supported":true,"enabled":true,"timeoutInSeconds":900}}]
   */
  this.getDevices = function () {
    return this.getEndPoint("https://my.tado.com/api/v2/homes/%homeId%/zones");
  }

  /**
   * Return the info for a specific device
   *
   * @param  {Number} deviceId The device id provided by getDevices()
   * @return {Object}
   *
   * example of what is returned: {"tadoMode":"HOME","geolocationOverride":false,"geolocationOverrideDisableTime":null,"preparation":null,"setting":{"type":"AIR_CONDITIONING","power":"ON","mode":"HEAT","temperature":{"celsius":20.00,"fahrenheit":68.00},"fanSpeed":"AUTO"},"overlayType":null,"overlay":null,"openWindow":null,"nextScheduleChange":{"start":"2020-02-17T23:00:00Z","setting":{"type":"AIR_CONDITIONING","power":"OFF"}},"nextTimeBlock":{"start":"2020-02-17T23:00:00.000Z"},"link":{"state":"ONLINE"},"activityDataPoints":{"acPower":{"timestamp":"2020-02-17T16:29:07.591Z","type":"POWER","value":"ON"}},"sensorDataPoints":{"insideTemperature":{"celsius":20.77,"fahrenheit":69.39,"timestamp":"2020-02-17T17:50:05.811Z","type":"TEMPERATURE","precision":{"celsius":0.1,"fahrenheit":0.1}},"humidity":{"type":"PERCENTAGE","percentage":67.60,"timestamp":"2020-02-17T17:50:05.811Z"}}}
   */
  this.getDevice = function(deviceId) {
    return this.getEndPoint("https://my.tado.com/api/v2/homes/%homeId%/zones/"+deviceId+"/state");
  }

  /**
   * It will tell you if you're at home ("presence" equals to "HOME") or not
   *
   * @return {Object} {presence, presenceLocker}
   */
  this.getPresence = function () {
    return this.getEndPoint("https://my.tado.com/api/v2/homes/%homeId%/state");
  }

  /**
   * Return info about the external weather
   *
   * @return {Object}
   *
   * example: {"solarIntensity":{"type":"PERCENTAGE","percentage":0.00,"timestamp":"2020-02-17T17:59:48.840Z"},"outsideTemperature":{"celsius":12.82,"fahrenheit":55.08,"timestamp":"2020-02-17T17:59:48.840Z","type":"TEMPERATURE","precision":{"celsius":0.01,"fahrenheit":0.01}},"weatherState":{"type":"WEATHER_STATE","value":"NIGHT_CLOUDY","timestamp":"2020-02-17T17:59:48.840Z"}}
   */
  this.getWeather = function () {
    return this.getEndPoint("https://my.tado.com/api/v2/homes/%homeId%/weather");
  }

  /**
   * Permit to set a setting for a device
   *
   * @param {Number} deviceId The device id
   * @param {Object} params   A JSON String with the required elements
   *
   * examples of params:
   *   - to stop infinitely the device: {"setting":{"type":"AIR_CONDITIONING","power":"OFF"}}
   *   - to start the device with 21°C in Heat mode: {"setting":{"type":"AIR_CONDITIONING","power":"ON","mode":"HEAT","fanSpeed":"AUTO","temperature":{"celsius": 21}}}
   */
  this.setDevice = function (deviceId, params) {
    return this.getEndPoint("https://my.tado.com/api/v2/homes/%homeId%/zones/"+deviceId+"/overlay", params);
  }

  /**
   * Reset the manual mode
   *
   * @param  {Number} deviceId The device Id
   */
  this.resetDevice = function (deviceId) {
    return this.getEndPoint("https://my.tado.com/api/v2/homes/%homeId%/zones/"+deviceId+"/overlay", 'DELETE');
  }
}

module.exports = Tado;
