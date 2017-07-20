var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var cors = require('cors');

var app = express();

//this creates a connection object which will later connect to mySQL database.
//I used the ClearDB addon provided by Heroku for this.
var connection = mysql.createConnection({
    host: 'us-cdbr-iron-east-03.cleardb.net',
    user: 'b53283652bc954',
    password: '86127b66',
    database: 'heroku_68e1a2399363654'
})

//body parser allows us to easily look at the json that is sent through the server.
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json())
app.use(cors())

var port = process.env.PORT || 3000;

var router = express.Router();

//connect to the port, as well as mySQL, and throw an err if the database is unreachable.
connection.connect(function(err) {
   if (err)
      throw err
   else {
       console.log('Connected to MySQL');
       // Start the app when connection is ready
       app.listen(port);
       console.log('Server listening on port');
   }
});

//the web browser will make a get request at the root url since it is only a single page application.
//The root url on heroku is: https://pure-hollows-72424.herokuapp.com/
router.get('/', function(req, res) {
  connection.query("SELECT * from gps_data_table", function(err, result, fields) {
      if(err) throw err;
      res.json(result)
  })
});

//the raspberry pi will post data to the database through this post request at the same root url.
//we will create a json object with three fields, and send it through http.
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
