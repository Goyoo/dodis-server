var Zk= require('./Zk');
var CronJob = require('cron').CronJob;


function Check (dbname, options) {
	options= options || {};
	this.cronjob= new CronJob(options.job_time || '* * * * * *', function () {

        }, function () {
        	console.log('Stop CronJob.')
        },
        true
    );
    this.zk= new Zk(dbname);
}

Check.prototype.group_master = function() {
	
}

