const { Client } = require('pg'),
      request = require('request'),
      fs = require('fs'),
      nodemailer = require('nodemailer');

function createClient() {
  const client = new Client({
    user: 'ryanabest',
    host: 'datastructures.cbijimkrmieh.us-east-1.rds.amazonaws.com',
    database: 'datastructures',
    password: process.env.AWS_PW,
    port: 5432,
  });

  return client;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ryan.a.best@gmail.com",
    pass: process.env.GMAIL
  }
})

init();

function init() {
  // let sample = JSON.parse(fs.readFileSync('assets/darksky_sample.json','utf8'));
  // let todaysData = getToday(sample);
  // writeData(todaysData);
  callAPI();
}

/////////////// Parse out today's data from the Dark Sky API output ///////////////
/////////// There are two options here - I'm going to take the first row /////////
function getToday(input) {
  let rawData = firstRow();

  function firstRow() {
    let todaysData = input.daily.data[0];
    return todaysData;
  }

  function todayCheck() {
    let todaysData;
    let dailyData = input.daily.data;
    for (let d=0;d<dailyData.length;d++) {
      let dayData = dailyData[d],
          today = new Date(),
          day = new Date(0);
      day.setUTCSeconds(dayData.time);
      today.setHours(0);
      today.setMinutes(0);
      today.setSeconds(0);
      today.setMilliseconds(0);
      if(day.getTime()===today.getTime()) {
        todaysData=dayData
      };
    }
    return todaysData;
  }

  return rawData;
}

//// Given an input which is today's data (a list), write it to the database ////
function writeData(todaysData) {

  let darkskyData = process(todaysData);
  insertData(darkskyData);

  function insertData(darkskyData) {
    let query = `
      INSERT INTO darksky_forecast (date_added,forecast_date,forecast_time,summary,sunriseTime,sunriseDateTime,sunsetTime,sunsetDateTime,precipIntensity,precipIntensityMax,precipIntensityMaxTime,precipIntensityMaxDateTime,precipProbability,precipType,temperatureHigh,temperatureHighTime,temperatureHighDateTime,temperatureLow,temperatureLowTime,temperatureLowDateTime,apparentTemperatureHigh,apparentTemperatureHighTime,apparentTemperatureHighDateTime,apparentTemperatureLow,apparentTemperatureLowTime,apparentTemperatureLowDateTime,cloudCover,uvIndex,uvIndexTime,uvIndexDateTime,temperatureMin,temperatureMinTime,temperatureMinDateTime,temperatureMax,temperatureMaxTime,temperatureMaxDateTime,apparentTemperatureMin,apparentTemperatureMinTime,apparentTemperatureMinDateTime,apparentTemperatureMax,apparentTemperatureMaxTime,apparentTemperatureMaxDateTime)
      VALUES
      (
          '` + darkskyData.date_added + `'::TIMESTAMP WITH TIME ZONE
          ,'` + darkskyData.forecast_date + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.forecast_time + `
          ,'` + darkskyData.summary + `'
          ,` + darkskyData.sunriseTime + `
          ,'` + darkskyData.sunriseDateTime + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.sunsetTime + `
          ,'` + darkskyData.sunsetDateTime + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.precipIntensity + `
          ,` + darkskyData.precipIntensityMax + `
          ,` + darkskyData.precipIntensityMaxTime + `
          ,'` + darkskyData.precipIntensityMaxDateTime + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.precipProbability + `
          ,'` + darkskyData.precipType + `'
          ,` + darkskyData.temperatureHigh + `
          ,` + darkskyData.temperatureHighTime + `
          ,'` + darkskyData.temperatureHighDateTime + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.temperatureLow + `
          ,` + darkskyData.temperatureLowTime + `
          ,'` + darkskyData.temperatureLowDateTime + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.apparentTemperatureHigh + `
          ,` + darkskyData.apparentTemperatureHighTime + `
          ,'` + darkskyData.apparentTemperatureHighDateTime + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.apparentTemperatureLow + `
          ,` + darkskyData.apparentTemperatureLowTime + `
          ,'` + darkskyData.apparentTemperatureLowDateTime + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.cloudCover + `
          ,` + darkskyData.uvIndex + `
          ,` + darkskyData.uvIndexTime + `
          ,'` + darkskyData.uvIndexDateTime + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.temperatureMin + `
          ,` + darkskyData.temperatureMinTime + `
          ,'` + darkskyData.temperatureMinDateTime + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.temperatureMax + `
          ,` + darkskyData.temperatureMaxTime + `
          ,'` + darkskyData.temperatureMaxDateTime + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.apparentTemperatureMin + `
          ,` + darkskyData.apparentTemperatureMinTime + `
          ,'` + darkskyData.apparentTemperatureMinDateTime + `'::TIMESTAMP WITH TIME ZONE
          ,` + darkskyData.apparentTemperatureMax + `
          ,` + darkskyData.apparentTemperatureMaxTime + `
          ,'` + darkskyData.apparentTemperatureMaxDateTime + `'::TIMESTAMP WITH TIME ZONE
      );
    `;

    runQuery(query);

    function runQuery(query) {
      // console.log(query);
      const client = createClient();
      client.connect();
      client.query(query, (err, res) => {
        if (err) {
          console.log(err.stack);
        } else {
          console.log(res.rowCount);
          client.end();
        }
      });
    }
  }

  /////// Clean up the data and put it in a format my table is expecting ///////
  function process(todaysData) {
    let darkskyData,
        forecastDate = new Date(0),
        sunriseDateTime = new Date(0),
        sunsetDateTime = new Date(0),
        precipIntensityMaxDateTime = new Date(0),
        temperatureHighDateTime = new Date(0),
        temperatureLowDateTime = new Date(0),
        apparentTemperatureHighDateTime = new Date(0),
        apparentTemperatureLowDateTime = new Date(0),
        uvIndexDateTime = new Date(0),
        temperatureMinDateTime = new Date(0),
        temperatureMaxDateTime = new Date(0),
        apparentTemperatureMinDateTime = new Date(0),
        apparentTemperatureMaxDateTime = new Date(0);

    forecastDate.setUTCSeconds(todaysData.time);
    sunriseDateTime.setUTCSeconds(todaysData.sunriseTime);
    sunsetDateTime.setUTCSeconds(todaysData.sunsetTime);
    precipIntensityMaxDateTime.setUTCSeconds(todaysData.precipIntensityMaxTime);
    temperatureHighDateTime.setUTCSeconds(todaysData.temperatureHighTime);
    temperatureLowDateTime.setUTCSeconds(todaysData.temperatureLowTime);
    apparentTemperatureHighDateTime.setUTCSeconds(todaysData.apparentTemperatureHighTime);
    apparentTemperatureLowDateTime.setUTCSeconds(todaysData.apparentTemperatureLowTime);
    uvIndexDateTime.setUTCSeconds(todaysData.uvIndexTime);
    temperatureMinDateTime.setUTCSeconds(todaysData.temperatureMinTime);
    temperatureMaxDateTime.setUTCSeconds(todaysData.temperatureMaxTime);
    apparentTemperatureMinDateTime.setUTCSeconds(todaysData.apparentTemperatureMinTime);
    apparentTemperatureMaxDateTime.setUTCSeconds(todaysData.apparentTemperatureMaxTime);


    darkskyData = {
      date_added: new Date().toISOString(),
      forecast_date : forecastDate.toISOString(),
      forecast_time : todaysData.time,
      summary: todaysData.summary,
      sunriseTime: todaysData.sunriseTime,
      sunriseDateTime: sunriseDateTime.toISOString(),
      sunsetTime: todaysData.sunsetTime,
      sunsetDateTime: sunsetDateTime.toISOString(),
      precipIntensity: todaysData.precipIntensity,
      precipIntensityMax: todaysData.precipIntensityMax,
      precipIntensityMaxTime: todaysData.precipIntensityMaxTime,
      precipIntensityMaxDateTime: precipIntensityMaxDateTime.toISOString(),
      precipProbability: todaysData.precipProbability,
      precipType: todaysData.precipType,
      temperatureHigh: todaysData.temperatureHigh,
      temperatureHighTime: todaysData.temperatureHighTime,
      temperatureHighDateTime: temperatureHighDateTime.toISOString(),
      temperatureLow: todaysData.temperatureLow,
      temperatureLowTime: todaysData.temperatureLowTime,
      temperatureLowDateTime: temperatureLowDateTime.toISOString(),
      apparentTemperatureHigh: todaysData.apparentTemperatureHigh,
      apparentTemperatureHighTime: todaysData.apparentTemperatureHighTime,
      apparentTemperatureHighDateTime: apparentTemperatureHighDateTime.toISOString(),
      apparentTemperatureLow: todaysData.apparentTemperatureLow,
      apparentTemperatureLowTime: todaysData.apparentTemperatureLowTime,
      apparentTemperatureLowDateTime: apparentTemperatureLowDateTime.toISOString(),
      cloudCover: todaysData.cloudCover,
      uvIndex: todaysData.uvIndex,
      uvIndexTime: todaysData.uvIndexTime,
      uvIndexDateTime: uvIndexDateTime.toISOString(),
      temperatureMin: todaysData.temperatureMin,
      temperatureMinTime: todaysData.temperatureMinTime,
      temperatureMinDateTime: temperatureMinDateTime.toISOString(),
      temperatureMax: todaysData.temperatureMax,
      temperatureMaxTime: todaysData.temperatureMaxTime,
      temperatureMaxDateTime: temperatureMaxDateTime.toISOString(),
      apparentTemperatureMin: todaysData.apparentTemperatureMin,
      apparentTemperatureMinTime: todaysData.apparentTemperatureMinTime,
      apparentTemperatureMinDateTime: apparentTemperatureMinDateTime.toISOString(),
      apparentTemperatureMax: todaysData.apparentTemperatureMax,
      apparentTemperatureMaxTime: todaysData.apparentTemperatureMaxTime,
      apparentTemperatureMaxDateTime: apparentTemperatureMaxDateTime.toISOString()
    }

    return darkskyData;
  }

}

function callAPI() {
  // https://openweathermap.org/forecast5
  let lat = 40.6827819,
      lon = -73.9666949,
      darkSky = process.env.DARKSKY,
      apiURL = "https://api.darksky.net/forecast/"+darkSky+"/"+lat+","+lon+"?units=si&exclude=currently,minutely,hourly";

  request(apiURL, function(err,resp,body) {
    if (err) {
      function sendEmail(callback) {
        let mailOptions = {
          from: 'ryan.a.best@gmail.com',
          to: 'bestr008@newschool.edu',
          subject: 'Darksky Forecast API Error as of ' + new Date(),
          text: "Tried to get today's forecast data from Darksky today, specifically at " + new Date() + ', and got a failure.'
        }

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Particle is not connected! Email sent: ' + info.response);
          }
        });
      }

      sendEmail(function() {throw err});
    }
    else {
      let json = JSON.parse(body);
      let todaysData = getToday(json);
      writeData(todaysData);
    }
  });
}
