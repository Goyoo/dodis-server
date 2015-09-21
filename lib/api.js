var _ = require('underscore');
var http= require('http');

function Api (options) {

	this.options= options || {};
	return this;
}

Api.prototype.response= function (res, callback){
	var data= [];
	res.on('data', function (chunk){
		data.push(chunk)
	});
	res.on('end', function(){
		data= Buffer.concat(data).toString();
		console.log(data);
		if(res.statusCode === 200){
			callback && callback(null, data)
		}
		else{
			callback && callback(res.statusCode, data);
		}
	})
}

Api.prototype.get = function(options, callback) {
	options.method= 'GET';
	options.headers= _.extend({'Content-Type': 'application/json'}, options.headers || {});
	var _this= this;
	var req= http.request( _.extend(options, this.options) , function (res){
		_this.response(res, callback);
	});
	console.log('get:', options.path);
	req.end();
};

Api.prototype.put= function(options, data, callback){
	options.method= 'PUT';
	options.headers= _.extend({'Content-Type': 'application/json'}, options.headers || {});
	var _this= this;
	var req= http.request( _.extend(options, this.options) , function (res){
		_this.response(res, callback);
	});
	console.log('put:', options.path, data);
	req.write(data || '');
	req.end();
}

Api.prototype.post= function(options, data, callback){
	options.method= 'POST';
	options.headers= _.extend({'Content-Type': 'application/json'}, options.headers || {});
	var _this= this;
	var req= http.request( _.extend(options, this.options) , function (res){
		_this.response(res, callback);
	});
	console.log('post:', options.path, data);
	req.write(data || '');
	req.end();
}

Api.prototype.delete= function(options, callback){
	options.method= 'DELETE';
	options.headers= _.extend({'Content-Type': 'application/json'}, options.headers || {});
	var _this= this;
	var req= http.request( _.extend(options, this.options) , function (res){
		_this.response(res, callback);
	});
	console.log('delete:', options.path);
	req.end();
}

module.exports= Api;