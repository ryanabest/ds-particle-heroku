const { Client } = require('pg');
const async = require('async');

const client = new Client({
  user: 'ryanabest',
  host: 'datastructures.cbijimkrmieh.us-east-1.rds.amazonaws.com',
  database: 'datastructures',
  password: process.env.AWS_PW,
  port: 5432,
})

init();

function init() {
  client.connect();
  let query = tableQuery();
  runQuery(client,query);
  // helloWorld();
}

function tableQuery() {
  let query = `
    CREATE TABLE particle_temperature
    (
       name varchar(50)
      ,result double precision
      ,last_heard timestamp with time zone
      ,last_handshake_at timestamp with time zone
      ,device_id varchar(50)
      ,product_id int

    );
  `
  return query;
}

function runQuery(client,query) {
  client.query(query, (err, res) => {
    if (err) {
      console.log(err.stack);
    } else {
      console.log(res);
      client.end();
    }
  });
}

// Hello World
function helloWorld() {
  console.log(process.env.AWS_PW);
  client.query("SELECT '2018-11-07T21:45:35-05:00'::timestamp ,'2018-11-07T21:45:35-05:00'::TIMESTAMP WITH TIME ZONE as now", (err,res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log(res)
    }
    client.end();
  });
}
