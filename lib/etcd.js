var http= require('http');
var Api= require('./api');
var config= require('../config');
var _ = require('underscore');
var hostArray = config.etcd_hostname.split(':');

function Etcd (name, callback) {

	var _this= this;
	this.prefix= '/v2/keys/dodis';
	this.name= name ? this.prefix + '/'+ name : this.prefix;
	callback && this.init(callback);
	return this;
}

Etcd.prototype= new Api({agent: new http.Agent({ keepAlive: true }), host: hostArray[0], port: hostArray[1]});

Etcd.prototype.init= function(callback){
	this.put({
		path: this.name + '?dir=true'
	}, '', callback);
}

Etcd.prototype.get_dir= function(name, callback){
	this.get({
		path: this.name+ '/' + name
	}, function (statusCode , data){
		callback(statusCode, JSON.parse(data));
	})
}

Etcd.prototype.get_file= function(name, callback){
	this.get({
		path: this.name+ '/' + name
	}, function (statusCode , data){
		callback(statusCode, JSON.parse(data));
	})
}

Etcd.prototype.push_file= function(name, value, callback) {
	this.put({
		path: this.name+ '/' + name + '?value='+ value
	}, '', callback);
};

Etcd.prototype.remove_file= function(name) {
	this.delete({
		path: this.name+ '/' + name
	});
};


module.exports= Etcd;