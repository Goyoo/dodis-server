var http= require('http');
var Api= require('./api');
var config= require('../config');
var _ = require('underscore');
var hostArray = config.dashboard_hostname.split(':');


function Dashboard () {

}

Dashboard.prototype= new Api({agent: new http.Agent({ keepAlive: true }), host: hostArray[0], port: hostArray[1]});

Dashboard.prototype.create_server_groups = function(id, callback) {

	this.put({
		path: '/api/server_groups'
	}, JSON.stringify({id: id}), function (statusCode, data){
		if(statusCode === 200){
			data= JSON.parse(data);
			callback(null, data);
		}
		else{
			callback(statusCode);
		}
	})
};

Dashboard.prototype.list_server_groups= function(callback){
	this.get({
		path: '/api/server_groups'
	}, function (statusCode, data){
		if(statusCode === 200){
			data= JSON.parse(data);
			callback(null, data);
		}
		else{
			callback(statusCode);
		}
	})
}

Dashboard.prototype.add_server_in_group= function (groupID, addr, type, callback){
	//type=slave
	this.put({
		path: '/api/server_group/'+groupID+'/addServer'
	}, JSON.stringify({addr: addr, group_id: groupID, type: type}),function (statusCode, data){
		if(statusCode === 200){
			data= JSON.parse(data);
			callback(null, data);
		}
		else{
			callback(statusCode);
		}
	})
}

Dashboard.prototype.remove_server_in_group= function (groupID, addr, type, callback){
	//type=offline
	this.put({
		path: '/api/server_group/'+groupID+'/removeServer'
	}, JSON.stringify({addr: addr, group_id: groupID, type: type}),function (statusCode, data){
		if(statusCode === 200){
			data= JSON.parse(data);
			callback(null, data);
		}
		else{
			callback(statusCode);
		}
	})
}

Dashboard.prototype.master_server_in_group= function (groupID, addr, type, callback){
	//type=slave
	this.put({
		path: '/api/server_group/'+type+'/promote'
	}, JSON.stringify({addr: addr, group_id: groupID, type: type}),function (statusCode, data){
		if(statusCode === 200){
			data= JSON.parse(data);
			callback(null, data);
		}
		else{
			callback(statusCode);
		}
	})
}


module.exports= new Dashboard();