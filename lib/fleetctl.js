var http= require('http');
var Api= require('./api');
var config= require('../config');
var _ = require('underscore');
var hostArray = config.fleetctl_hostname.split(':');


function Fleetctl () {

}


Fleetctl.prototype= new Api({agent: new http.Agent({ keepAlive: true }), host: hostArray[0], port: hostArray[1]});

Fleetctl.prototype.convertToJson= function (configstring, options){

	options= options || {};
	var list= [];
	var rows= [];
	var section= '';
	var values= null;
	var regexp= /\[(.+)\]/;
	try{
		rows= configstring.toString().split('\n').filter(Boolean);
	}catch(e){
		throw new Error('The Bad Config.');
	}

	rows.forEach(function (row){
		var reg;
		if(row.indexOf('#') === 0 || !row.trim()){
			
		}
		else if(reg=regexp.exec(row.trim())){
			section= reg[1];
		}
		else{
			values= [];
			values[0]= row.substring(0, row.indexOf('='));
			values[1]= row.substring(row.indexOf('=')+1, row.length);
			if(!values[0] || !values[1]){
				throw new Error('Config Fail: '+ row);
			}
			list.push({
				section: section,
				name: values[0].trim(),
				value: values[1].trim()
			})
		}
	})
	return JSON.stringify(_.extend(options, {options : list}));

}

Fleetctl.prototype.create_unit= function (name, fileconfig, desiredstate, callback, machineID){
	var json = this.convertToJson(fileconfig, {desiredState: desiredstate, machineID: machineID});
	this.put({
		path: '/fleet/v1/units/'+ name
	}, json, callback)
}

Fleetctl.prototype.modify_unit= function (name, fileconfig, desiredstate, callback){
	var json = this.convertToJson(fileconfig, {desiredState: desiredstate});
	this.put({
		path: '/fleet/v1/units/'+ name
	}, json, callback)
}

Fleetctl.prototype.list_unit= function (callback){
	this.get({
		path: '/fleet/v1/units'
	}, callback)
}

Fleetctl.prototype.get_unit= function (name, callback){
	this.get({
		path: '/fleet/v1/units/'+ name
	}, callback)
}

Fleetctl.prototype.destroy_unit= function (name, callback){
	this.delete({
		path: '/fleet/v1/units/'+ name
	}, callback)
}

Fleetctl.prototype.list_state= function (callback){
	this.get({
		path: '/fleet/v1/state'
	}, callback)
}

Fleetctl.prototype.list_machines= function (callback){
	this.get({
		path: '/fleet/v1/machines'
	}, callback);
}
module.exports= new Fleetctl();
