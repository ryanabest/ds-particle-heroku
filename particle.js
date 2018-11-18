const { Client } = require('pg'),
      request = require('request'),
      nodemailer = require('nodemailer');

// moment().tz("America/New_York").format();


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
  // this loop will run every 30 seconds 20 times
  // I will set up a Heroku Scheduler to run this code every 10 minutes, ensuring that I will load one value per minute continuously throught the day
  for (let i=0;i<19;i++) {
    setTimeout(function() {
      callAPI();
    }, 30000 * i);
  }
}

function callAPI() {
  let apiURL = "https://api.particle.io/v1/devices/ryanabest-ds-temperature/analogvalue?access_token="  + process.env.PARTICLE;
  let particleData

  request(apiURL, function(err,resp,body) {
    if (err) {
      function sendEmail(callback) {
        let mailOptions = {
          from: 'ryan.a.best@gmail.com',
          to: 'bestr008@newschool.edu',
          subject: 'Particle Disconnected as of ' + new Date(),
          text: 'Tried to push data from the particle on ' + new Date() + ' and got a failure:' + err
        }

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Particle is not connected! Email sent: ' + info.response);
          }
        });
      }

      sendEmail(function() {throw "quitting"});
    }
    else {

      let results = JSON.parse(body);
      // console.log(results);
      if (results.coreInfo.connected) {

        particleInit();

        function particleInit() {
          particleData = {
            name:               results.name,
            result:             results.result,
            last_heard:         results.coreInfo.last_heard,
            last_handshake_at:  results.coreInfo.last_handshake_at,
            device_id:          results.coreInfo.deviceID,
            product_id:         results.coreInfo.product_id
          }

          let query = particleQuery(particleData);
          // console.log(query);
          runQuery(query);

        }

        function runQuery(query) {
          const client = createClient();
          client.connect();
          client.query(query, (err, res) => {
            if (err) {
              console.log(err.stack);
            } else {
              // console.log(res.rowCount);
              client.end();
            }
          });
        }

        function particleQuery(data) {
          let query = `
            INSERT INTO particle_temperature (name,result,last_heard,last_handshake_at,device_id,product_id,date_added) VALUES
            (
               '`  + data.name + `'
               ,`  + data.result + `
               ,'` + data.last_heard + `'::TIMESTAMP WITH TIME ZONE
               ,'` + data.last_handshake_at + `'::TIMESTAMP WITH TIME ZONE
               ,'` + data.device_id + `'
               ,`  + data.product_id + `
               ,'` + new Date().toISOString() + `'::TIMESTAMP WITH TIME ZONE
            );
          `;

          return query
        }

      } else {

        // If the particle isn't connected, send me an email letting me know then quit out

        function sendEmail(callback) {
          let mailOptions = {
            from: 'ryan.a.best@gmail.com',
            to: 'bestr008@newschool.edu',
            subject: 'Particle Disconnected as of ' + new Date(),
            text: 'Tried to push data from the particle on ' + new Date() + ' and got a failure.'
          }

          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Particle is not connected! Email sent: ' + info.response);
            }
          });
        }

        sendEmail(function() {throw "quitting"});


      }
    }
  });
}
