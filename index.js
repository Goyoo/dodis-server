var config= require('./config');
var express = require('express');
var app = express();
var fleet= require('./router/fleet');
var redis= require('./router/redis');
var bodyParser = require('body-parser');

app.use(bodyParser.text({defaultCharset: 'utf-8', type:'text/*'}));
// app.use(bodyParser.json()); // for parsing application/json
// app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(function (req,res,next){
	res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	next();
});
app.use('/fleet', fleet);
app.use('/redis', redis);
app.listen(config.port);
console.log('app listen:', config.port);