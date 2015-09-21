var redis = require("redis");


module.exports = RedisDb;

function RedisDb(host, port) {
    if (!host)
        throw new Error('new RedisDb(host, port) is error, host is null.')
    else if (!port)
        throw new Error('new RedisDb(host, port) is error, port is null.')

    this.isEnable = false;
    this.db = redis.createClient(port, host, {
        retry_max_delay: 5000
    });
    this.bind();
    this.check();
    this.result = this.db;
    return this.result;
}
RedisDb.prototype.active = function () {
    if (this.db && this.db !== this.result) {
        this.result = this.db;
    }
}

RedisDb.prototype.enable = function () {
    if (!this.enableResult) {
        this.enableResult = {};
        var keys = Object.keys(this.db);
        for (var key in keys) {
            this.enableResult[key] = function () {
                for (var i = 0, len = arguments.length; i < len; i++) {
                    if (typeof arguments[i] === 'function') {
                        arguments[i]('redis is die');
                        break;
                    }
                }
            }
        }
        this.result = this.enableResult;
    }
};

RedisDb.prototype.check = function () {
    var self = this;
    // redis health check
    setInterval(function () {
        var myTimeout = setTimeout(function () {
            self.isEnable = false;
            self.enable();
        }, 2000)

        self.db.ping(function (err) {
            clearTimeout(myTimeout);
            if (err) {
                self.isEnable = false;
                self.enable();
                var len = self.db.command_queue.length;

                if (len > 1000) {
                    console.log('>> clean redis queue ', redis.command_queue.length);
                    for (var i = 0; i < len; i++) {
                        self.db.command_queue.shift();
                    }
                }
            } else {
                self.isEnable = true;
                self.active();
                //	 console.log('enable all redis command');
            }
        });
    }, 10000);

}

RedisDb.prototype.bind = function () {

    this.db.on("error", function (err) {
        this.isEnable = false;
        console.error("Redis ERROR: " + err);
    });

    this.db.on("ready", function () {
        this.isEnable = true;
    });

    this.db.on("reconnecting", function (arg) {
        console.error("Redis reconnecting: " + JSON.stringify(arg));
        this.isEnable = false;
    });

    this.db.on("connect", function () {
        this.isEnable = true;
    });

    this.db.on("end", function () {
        this.isEnable = false;
    });
};
