var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var cors = require('cors');

var app = express();

var db_config = {
    host            : 'us-cdbr-iron-east-03.cleardb.net',
    user            : 'b53283652bc954',
    password        : '86127b66',
    database        : 'heroku_68e1a2399363654'
};

var connection = mysql.createConnection(db_config);

// var pool = mysql.createPool({
//     connectionLimit: 10,
//     host            : 'us-cdbr-iron-east-03.cleardb.net',
//     user            : 'b53283652bc954',
//     password        : '86127b66',
//     database        : 'heroku_68e1a2399363654'
// })

//body parser allows us to easily look at the json that is sent through the server.
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json())
app.use(cors())

var port = process.env.PORT || 3000;

var router = express.Router();
//
// pool.getConnection(function(err, connection) {
//     if (err)
//       throw err
//     else {
//       c = connection;
//       console.log('Connected to MySQL');
//     }
// })

connection.connect(function(err){
    if(err) {
        // mysqlErrorHandling(connection, err);
        console.log("\n\t *** Cannot establish a connection with the database. ***");
        connection = reconnect(connection);
    }else {
        console.log("\n\t *** New connection established with the database. ***")
    }
});

function reconnect(connection){
    console.log("\n New connection tentative...");
    //- Destroy the current connection variable
    if(connection) connection.destroy();

    //- Create a new one
    var connection = mysql.createConnection(db_config);

    //- Try to reconnect
    connection.connect(function(err){
        if(err) {
            //- Try to connect every 2 seconds.
            setTimeout(reconnect, 2000);
        }else {
            console.log("\n\t *** New connection established with the database. ***")
            return connection;
        }
    });
}

connection.on('error', function(err) {
    //- The server close the connection.
    if(err.code === "PROTOCOL_CONNECTION_LOST"){
        console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
        connection = reconnect(connection);
    }

    //- Connection in closing
    else if(err.code === "PROTOCOL_ENQUEUE_AFTER_QUIT"){
        console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
        connection = reconnect(connection);
    }

    //- Fatal error : connection variable must be recreated
    else if(err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"){
        console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
        connection = reconnect(connection);
    }

    //- Error because a connection is already being established
    else if(err.code === "PROTOCOL_ENQUEUE_HANDSHAKE_TWICE"){
        console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
    }

    //- Anything else
    else{
        console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
        connection = reconnect(connection);
    }

});

app.listen(port);

//the web browser will make a get request at the root url since it is only a single page application.
//The root url on heroku is: https://pure-hollows-72424.herokuapp.com/
router.get('/', function(req, res) {
    if(connection == null)
      connection = reconnect(connection)
    connection.query("(SELECT * FROM gps_data_table ORDER BY id DESC LIMIT 5) ORDER BY id ASC", function(err, result, fields) {
        if(err) throw err;
        res.json(result)
    })
});

//the raspberry pi will post data to the database through this post request at the same root url.
//we will create a json object with three fields, and send it through http.
router.post('/', function(req, res) {
    if(connection == null)
      connection = reconnect(connection)
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
