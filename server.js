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
  connection.query("SELECT * from gps_data_table", function(err, result, fields) {
      if(err) throw err;
      res.json(result)
  })
});

router.post('/', function(req, res) {
    console.log("hello")
    let payload = {
      timeAdded: req.body.time,
      latitude: req.body.latitude,
      longitude: req.body.longitude
    }
    var sql = "INSERT INTO gps_data_table SET ?"
    connection.query(sql, payload, function (err, rows) {
      if (err) throw err;
      res.json({message: "you posted successfully!!"})
    });
})

app.use(router);

console.log('data available on port' + port);
