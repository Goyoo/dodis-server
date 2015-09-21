var port= process.env.PORT || '10717';
var fleetctl_hostname= process.env.FLEETCTL_HOSTNAME || '127.0.0.1:20717';
var etcd_hostname= process.env.ETCD_HOSTNAME || '127.0.0.1:30717';
var dashboard_hostname= process.env.DASHBOARD_HOSTNAME || '127.0.0.1:40717'
console.log('************')
console.log('PORT:', port);
console.log('FLEETCTL_HOSTNAME:', fleetctl_hostname);
console.log('ETCD_HOSTNAME:', etcd_hostname);
console.log('DASHBOARD_HOSTNAME:', dashboard_hostname);
console.log('************')

module.exports= {
	port: port,
	fleetctl_hostname: fleetctl_hostname,
	etcd_hostname: etcd_hostname,
	dashboard_hostname: dashboard_hostname
}