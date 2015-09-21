FROM node:0.12.1
MAINTAINER feng "241456911@qq.com"
WORKDIR /node-fleet-api
RUN \
    rm /etc/localtime && \
    ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
EXPOSE 10717
ADD ./package.json /node-fleet-api/
RUN npm install;
ENV \
	FLEETCTL_HOSTNAME=10.12.1.104:49153 \
	ETCD_HOSTNAME=10.12.1.105:4001 \
	DASHBOARD_HOSTNAME=10.12.1.101:18087 \
	PORT=10717
ADD . /node-fleet-api
CMD node index.js

