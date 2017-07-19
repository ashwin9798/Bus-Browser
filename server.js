var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');

var app = express();

var connection = mysql.createConnection({
    host: 'us-cdbr-iron-east-03.cleardb.net'
    username: 'b53283652bc954'
    password: '86127b66'
    database: 'heroku_68e1a2399363654'
})

app.use(bodyParser.urlencoded({
  extended: true
}));

var port = process.env.PORT || 3000;

var router = express.Router();

router.get('/', function(req, res) {
  res.json({ message: 'Welcome to map app!' });
});

router.post('/', function(req, res) {

})

app.use(router);
app.listen(port);

console.log('data available on port' + port);
