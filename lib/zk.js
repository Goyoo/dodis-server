var Redisdb= require('./redisdb');
var path= require('path')
var Api= require('./api');
var config= require('../config');
var express = require('express');
var _ = require('underscore');
var hostArray = config.etcd_hostname.split(':');

function Zk (dbname) {
	this.prefix='/v2';
	this.name= '/keys/zk/codis/db_'+ (dbname || 'test');
	this.proxy=[];
	this.redis=[];
	this.servers=[];
	this.groups=[];
	this.slots=[];
	this.redis_nodes=[];
	this.get_path(path.join(this.name, 'slots'), this.set_slots);
	this.get_path(path.join(this.name, 'servers')+ '?recursive=true', this.set_servers);
	this.get_path(path.join(this.name, 'proxy'), this.set_proxys);
}

Zk.prototype= new Api({agent: new http.Agent({ keepAlive: true }), hostname: hostArray[0], port: hostArray[1]});


Zk.prototype.get_path= function (pathname, callback){
	this.get({
		path: path.join(this.prefix, pathname)
	}, function (statusCode, data){
		if(statusCode)
			callback(statusCode);
		else{
			var json= JSON.parse(data);
			callback(null, json && json.node && json.node.nodes);
		}
	})
}

Zk.prototype.set_slots= function (error, slots){
	if(slots)
		this.slots= slots;
}

Zk.prototype.set_groups= function (error, groups){
	if(groups){
		this.groups= this.groups.concat(groups)
		for(var i =0; i< groups.length; i++){
			var redis_config= JSON.parse(groups[i].value);
			var redis_addr= redis_config.addr.split(':');
			redis_config.db= new Redisdb(redis_addr[0], redis_addr[1]);
			this.redis_nodes.push(redis_config);
		}
	}
}

Zk.prototype.set_servers= function (error, servers){
	if(servers){
		this.groups= [];
		this.redis_nodes= [];
		this.servers= servers;
		for(var i =0; i< servers.length; i++){
			this.set_groups(servers[i].nodes);
		}
	}
}

Zk.prototype.set_proxys= function (error, proxys){
	if(proxys)
		this.proxys= proxys;
}


module.exports= Zk;