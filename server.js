var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');

var app = express();

var connection = mysql.createConnection({
    host: 'us-cdbr-iron-east-03.cleardb.net',
    user: 'b53283652bc954',
    password: '86127b66',
    database: 'heroku_68e1a2399363654'
})

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json())

var port = process.env.PORT || 3000;

var router = express.Router();

connection.connect(function(err) {
   if (err)
      throw err
   else {
       console.log('Connected to MySQL');
       // Start the app when connection is ready
       app.listen(port);
       console.log('Server listening on port 3000');
   }
});

router.get('/', function(req, res) {
  res.json({ message: 'Welcome to map app!' });
  var sql = "CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))";
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
});

router.post('/', function(req, res) {
    console.log("hello")
    let payload = {
      time: req.body.time,
      latitude: req.body.latitude,
      longitude: req.body.longitude
    }
    // connection.query('INSERT INTO gps_data_table SET ?', payload, function(err, result) {
    //   if(err) {
    //     console.log(err);
    //     res.send('Error');
    //   }
    //   else {
    //     res.send('Success');
    //   }
    // });
    connection.query("SELECT * FROM gps_data_table", function (err, result, fields) {
      if (err) throw err;
      console.log(result);
    });
})

app.use(router);

console.log('data available on port' + port);
