var async = require('async');
var fs= require('fs')
var ejs= require('ejs');
var _ = require('underscore');
var http = require('http');
var fleetctl= require('../lib/fleetctl');
var express = require('express');
var router= module.exports= express.Router();
var docker_redis_group_template= fs.readFileSync(__dirname+ '/../template/docker-codis-group.service').toString();
var Etcd = require('../lib/etcd');
var dashboard= require('../lib/dashboard');

router.get('/', list);
router.post('/:name', start);
router.delete('/:name', stop);

function list(req, res){
	var etcd= new Etcd('');
	var list= [];
	etcd.get_dir('', function (statusCode, data){
		console.log('list:', data);
		if(data && data.node && data.node.nodes){
			data.node.nodes.forEach(function (pj){
				list.push({
					name: pj.key.replace('/dodis/', '')
				})
			})
		}
		res.send(list);
	})
}

function start (req, res) {

	var name= (req.params.name || '').split('.')[0];
	var description= req.query.description;
	var desiredstate= req.query.desiredstate;
	var count= req.query.count || 1;
	var group= req.query.group || 1;
	var maxmemory= req.query.maxmemory || 1000000000;
	var templates= [], results= [], configs= [];
	var number= count * group;
	var machines= [];
	if(!name){
		res.send({status: 'error', error: 'need set name value is string.'});
		return;
	}

	for(var i=1; i<= number; i++){
		var config_name= name +'-'+ i;
		var port= random_port(10000, 50000);
		configs.push({
			file_name: name + '@' + i+ '.service',
			name: name+ '@*.service',
			config_name: config_name,
			maxmemory: maxmemory,
			port: port,
			description: (description || name) + '-' + i,
			desiredstate: desiredstate || 'launched',
			etcd: new Etcd(name)
		})
	}

	async.series({
		machines: function(finish){
			fleetctl.list_machines(function (statusCode, data){
				if(data){
					machines= JSON.parse(data).machines;
				}
				finish();
			})
		},
		dashboard: function(finish){
			var machine= _.findWhere(machines, {primaryIP: '10.12.1.101'});
			console.log('start_dashboard in machine:'+ machine.id);
			start_dashboard(machine, function(){
				finish();
			})
		},
		proxy: function(finish){
			var machine= _.findWhere(machines, {primaryIP: '10.12.1.101'});
			console.log('start_proxy in machine:'+ machine.id);
			start_proxy(machine, function(){
				finish();
			})
		},
		redis: function(finish){
			async.mapSeries(configs, function (template_config, next){
				var trycount= 3, success= false;
				template_config.etcd.init(function(){
					template_config.etcd.get_file(template_config.file_name, function (statusCode, data){
						if(data && data.node && data.node.value){
							var json= JSON.parse(data.node.value);
							template_config.port= json.port;
						}
						async.whilst(function() {
						        return !(success || trycount <= 0)
						},
						function(cb) {
							var template_content= ejs.render(docker_redis_group_template, template_config);
							fleetctl.create_unit(template_config.file_name, template_content, template_config.desiredstate, function (statusCode, data){
								trycount--;
								if(Math.round(statusCode/200) === 1){
									success= true;
								}
								else{
									template_config.port= random_port(10000, 50000);
								}
								cb();
							})
						},
						function(err) {
							if(!success){
								results.push({name: template_config.file_name, status: 'fail'});
							}else{
								results.push({name: template_config.file_name, status: 'start'});
							}
							next();
						});		
					})
				})
			}, function (error){
				finish(error);
			})
		},
		group: function(finish){
			fleetctl.list_unit(function (statusCode, data){
				if(data){
					data= JSON.parse(data);
					var units= data.units, index=0;
					async.mapSeries(configs, function (template_config, next){
						var unit= _.findWhere(units, {name: template_config.file_name});
						var group_id= index%group + 1;
						var machine;
						async.whilst(function() {
						        return !machine;
						},
						function(cb) {
							machine= _.findWhere(machines, {id: unit.machineID});
							if(machine){
								cb();
							}else{
								setTimeout(function(){
									fleetctl.get_unit(template_config.file_name, function (statusCode, data){
										unit= JSON.parse(data);
										cb();
									})
								}, 500)
							}
						},
						function(err) {
							index++;
							template_config.addr= machine.primaryIP;
							dashboard.create_server_groups(group_id, function (statusCode, data){
								dashboard.add_server_in_group(group_id, [template_config.addr, template_config.port].join(':'), 'slave', function (statusCode, data){
									template_config.etcd.push_file(template_config.file_name, JSON.stringify({port: template_config.port, addr: template_config.addr, group_id: group_id}), function (statusCode, data){
										next();
									})
								})
							})
						});
					}, function (error){
						finish(error);
					})
				}
			})
		}
	}, function (error){
		if(error){
			res.statusCode= 5000;
			res.end();
		}else{
			res.set('content-type', 'application/json');
			res.send(results.sort(function (a, b){
				return a.name > b.name ? 1: -1;
			}))
		}
	})
}


function stop (req, res){
	var name = (req.params.name || '').split('.')[0];
	var results= [];
	if(!name){
		res.send({status: 'error', error: 'need set name value is string.'});
		return;
	}
	res.set('content-type', 'application/json');
	fleetctl.list_unit(function (statusCode, data){
		if(statusCode){
			res.send({statusCode: statusCode, error: data});
		}
		else{
			data= JSON.parse(data);
			var units= data.units;
			var nameRegexp= new RegExp('^'+name+ '\@\\d+\.service$');
			console.log('units.length:', units.length);
			async.mapSeries(units, function (unit, next){
				console.log(nameRegexp.test(unit.name), nameRegexp, unit.name);
				if(nameRegexp.test(unit.name)){
					var etcd= new Etcd(name);
					etcd.get_file(unit.name, function (statusCode, data){
						var json;
						if(data && data.node && data.node.value){
							json= JSON.parse(data.node.value);
							dashboard.remove_server_in_group(json.group_id || 1, [json.addr, json.port].join(':'), 'offline', function (statusCode, data){
								if(statusCode){
									console.log('remove_server_in_group callback:');
									fleetctl.destroy_unit(unit.name, function (statusCode, data){
										if(statusCode === 204 && data === ""){
											results.push({name: unit.name, status: 'delete'})
										}
										else{
											results.push({name: unit.name, status: 'fail', error: data, error_code: statusCode})
										}
										next();
									})
								}
								else{
									results.push({name: unit.name, status: 'delete'})
									next();
								}
							})
						}
						else{
							fleetctl.destroy_unit(unit.name, function (statusCode, data){
								if(statusCode === 204 && data === ""){
									results.push({name: unit.name, status: 'delete'})
								}
								else{
									results.push({name: unit.name, status: 'fail', error: data, error_code: statusCode})
								}
								next();
							})
						}
					})
				}
				else{
					next();
				}
			}, function (error){
				console.log('forEach end');
				stop_proxy(function(){
					stop_dashboard(function(){
						var etcd= new Etcd('')
						res.send(results.sort(function (a, b){
							return a.name > b.name ? 1: -1;
						}))
					})
				})
			})
				
		}
	})
}

function random_port(min, max){
	return Math.floor((Math.random() * max)+ min);
}

function start_proxy (machine, callback){
	return callback();
	if(machine){
		fleetctl.create_unit('codis-proxy-projectid.service', fs.readFileSync(__dirname+ '/../template/docker-codis-proxy.service').toString(), 'launched', function ( statusCode, data){
			callback && callback(statusCode, data);
		}, machine.id);
	}
	else{
		callback('no machine');
	}
}

function stop_proxy(callback){
	return callback();
	fleetctl.destroy_unit('codis-proxy-projectid.service', function(){
		callback && callback();
	})
}

function start_dashboard (machine, callback){
	return callback();
	if(machine){
		fleetctl.create_unit('codis-dashboard-projectid.service', fs.readFileSync(__dirname+ '/../template/docker-codis-dashboard.service').toString(), 'launched', function ( statusCode, data){
			callback && callback(statusCode, data);
		}, machine.id)
	}
	else{
		callback('no machine');
	}
}

function stop_dashboard(callback){
	return callback();
	fleetctl.destroy_unit('codis-dashboard-projectid.service', function(){
		callback && callback();
	})
}