var _ = require('underscore');
var http = require('http');
var fleetctl= require('../lib/fleetctl');
var express = require('express');
var router= module.exports= express.Router();


router.all('*', function (req, res, next){
	res.set('content-type', 'application/json');
	next();
})

router.get('/units', function (req, res){
	fleetctl.list_unit(function (statusCode, data){
		if(statusCode)
			res.send({status: 'error', statusCode: statusCode, data: data});
		else
			res.send({status: 'ok', data: JSON.parse(data)});
	})
});
router.get('/unit/:name', function (req, res){
	var name= req.params.name;
	fleetctl.get_unit(name, function (statusCode, data){
		if(statusCode)
			res.send({status: 'error', statusCode: statusCode, data: data});
		else
			res.send({status: 'ok', data: JSON.parse(data)});
	})
});
router.post('/unit/:name', function (req, res){
	var name= req.params.name;
	var desiredstate= req.query.desiredstate;
	var fileconfig= req.body;
	fleetctl.create_unit(name, fileconfig, desiredstate, function (statusCode, data){
		if(statusCode)
			res.send({status: 'error', statusCode: statusCode, data: data});
		else
			res.send({status: 'ok', data: JSON.parse(data)});
	})
});
router.put('/unit/:name', function (req, res){
	var name= req.params.name;
	var desiredstate= req.query.desiredstate;
	var fileconfig= req.body;
	fleetctl.modify_unit(name, fileconfig, desiredstate, function (statusCode, data){
		if(statusCode)
			res.send({status: 'error', statusCode: statusCode, data: data});
		else
			res.send({status: 'ok', data: JSON.parse(data)});
	})
});
router.delete('/unit/:name', function (req, res){
	var name= req.params.name;
	fleetctl.destroy_unit(name, function (statusCode, data){
		if(statusCode)
			res.send({status: 'error', statusCode: statusCode, data: data});
		else
			res.send({status: 'ok', data: JSON.parse(data)});
	})
});
router.get('/state', function (req, res){
	fleetctl.list_state(function (statusCode, data){
		if(statusCode)
			res.send({status: 'error', statusCode: statusCode, data: data});
		else
			res.send({status: 'ok', data: JSON.parse(data)});
	})
});
router.get('/machines', function (req, res){
	fleetctl.list_machines(function (statusCode, data){
		if(statusCode)
			res.send({status: 'error', statusCode: statusCode, data: data});
		else
			res.send({status: 'ok', data: JSON.parse(data)});
	})
});
