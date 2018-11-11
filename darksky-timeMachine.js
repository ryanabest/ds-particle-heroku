const { Client } = require('pg'),
      fs = require('fs'),
      request = require('request');

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

init();

function init() {
  callAPI();
}

function callAPI() {
  let lat = 40.6827819,
      lon = -73.9666949,
      // time = 1541653200,
      // time = 1541739600,
      today = new Date(),
      darkSky = process.env.DARKSKY;

  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  today.setMilliseconds(0);

  let time = Date.parse(today),
      apiURL = "https://api.darksky.net/forecast/"+darkSky+"/"+lat+","+lon+","+time+"?units=si&exclude=currently,minutely";

  console.log(apiURL);

  // request(apiURL, function(err,resp,body) {
  //   if (err) {throw err;}
  //   else {
  //     let json = JSON.parse(body);
  //     fs.writeFileSync('assets/darksky_'+time+'.json',JSON.stringify(json));
  //   }
  // });
}
