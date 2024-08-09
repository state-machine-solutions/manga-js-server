const socketIO = require('socket.io');
const express = require('express');
const socketAuth = require('socketio-auth');
const app = express();
const configPermissions = require('../../utils/configPermissions');

function IoServer(stateMachineServer, config = null) {
    const cors = config?.cors;
    const auth = config?.auth;
    const me = this;
    this.permissions = configPermissions(config?.permissions);
    const useTempData = config?.useTempData == true;
    if (!config?.port) {
        throw new Error("port is required for socket io");
    }
    this.config = config;
    this.port = config?.port;
    const httpServer = require('http').createServer(app)
    let io = socketIO(httpServer, {
        cors
        // cors: {
        //     origin: "*"
        //   }
    });
    function authenticate(socket, data, callback) {
        const username = data.username;
        const password = data.password;
        return callback(null, auth?.password == password && username == auth?.username);
    }
    function postAuthenticate(socket, data) {
        const username = data.username;
        socket.client.user = { username };
    }
    function disconnect(socket, err) {
        console.log(socket.id + ' disconnected');
    }
    if (auth?.username) {
        socketAuth(io, {
            authenticate,
            postAuthenticate,
            disconnect,
            timeout: 1000
        }
        );
    }
    const loggedClients = new Map();
    const loggedNames = new Map();
    const connectedClients = new Map();
    let checkinClients = 0;
    let connectedClientsTotal = 0;
    this.measureBytes = config?.measureBytes == true;
    this.stats = {
        totalBytes: 0,
        partialBytes: 0
    }
    this.logs = [];
    function addLog() {
        me.logs.push(Array.from(arguments));
        if (me.logs.length > 50) {
            me.logs.shift();
        }
    }
    this.getCheckinClientsTotal = () => {
        return checkinClients;
    }
    this.getConnectedClientsTotal = () => {
        return connectedClientsTotal;
    }
    this.getConnectedClients = () => {
        return connectedClients;
    }
    this.getLoggedNames = () => {
        return loggedNames;
    }
    this.getLoggedClients = () => {
        return loggedClients;
    }
    this.getIo = () => {
        return io;
    }
    this.start = () => {
        io.listen(me.port);
        addLog("socket.io listen ON " + me.port);
        //@see: https://www.npmjs.com/package/message-socket
    }
    this.restart = () => {
        addLog('IoServer - RESTART')
        io.close();
        io.listen(port);
    }

    this.sendClearExecuted = () => {
        io.emit('onClear');
    }
    let countConnections = 0;
    io.on('disconnect', (client) => {
        addLog("(<) socket.io client Disconnected ", client.id);
    });
    function showDataBytesUsageFromClient(method, client, data) {
        if (!me.measureBytes) {
            return;
        }
        let strData = JSON.stringify(data);
        let bytes = Buffer.byteLength(strData, 'utf8');
        client.totalBytes += bytes;
        me.stats.totalBytes += bytes;
        client.lastBytes.set(client.messageCount++, { date: new Date(), bytes });
    }
    function updateLastsBytes() {
        if (!me.measureBytes) {
            return;
        }
        let d = new Date();
        let totalPartialBytes = 0;
        connectedClients.forEach((client, client_id) => {
            //removing last bytes mor old then 1 secconds
            let partialBytes = 0;
            client.lastBytes.forEach((data, key) => {
                if (data.date < d - 1000) {
                    partialBytes += data.bytes;
                } else {
                    //out of date, remove
                    client.lastBytes.delete(key);
                }
            }
            );
            totalPartialBytes += partialBytes;
            client.partialBytes = partialBytes;
        });
        me.stats.partialBytes = totalPartialBytes;
    }
    setInterval(updateLastsBytes, 1000);
    io.on('connection', (client) => {
        //to void the error : (node:10720) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 connect listeners added to [Socket]. Use emitter.setMaxListeners() to increase limit
        client.setMaxListeners(0);
        client.totalBytes = 0;
        client.partialBytes = 0;
        client.messageCount = 0;
        client.lastBytes = new Map();
        client.dateIn = new Date();
        connectedClients.set(client.id, client);
        connectedClientsTotal = connectedClients.size;
        addLog("(>) socket.io client connected:", client.id)

        client.on('testSend', (data) => {
            addLog(' testSend called with', data);
            showDataBytesUsageFromClient("testSend", client, data);
            client.emit('testResult', data);
        });

        client.on('checkin', (data) => {
            addLog("############### [ client registered ] ###############");
            addLog("(>) ID : ", client.id);
            addLog("######################################################");
            loggedClients.set(client.id, data);
            showDataBytesUsageFromClient("checkin", client, data);
            if (data?.name) {
                loggedNames.set(client.id, data.name);
                client.clientName = data.name;
            }
            checkinClients = loggedClients.size;

        });
        client.on('close', () => {
            //removing all listeners
            addLog("############### < client close /> ###############");
            client.removeAllListeners();
        })
        client.on('disconnect', (reason) => {
            stateMachineServer.removeAllListener(client);
            addLog("############### [ client disconected ] ###############");
            addLog("(<) ID : ", client.id);
            if (loggedClients.has(client.id)) {
                addLog(loggedClients.get(client.id))
                loggedClients.delete(client.id);
            }
            connectedClients.delete(client.id);
            checkinClients = loggedClients.size;
            connectedClientsTotal = connectedClients.size;
            addLog("######################################################");
            client.removeAllListeners();
        });
        client.on('set', async (data, ack) => {
            if (typeof data == 'string') {
                addLog('set called - data should be an object string was given:', data)
                return;
            }
            showDataBytesUsageFromClient("set", client, data);
            const validate = data.hasOwnProperty('validate') ? data.validate : true;
            if (useTempData) {
                const timeout = parseInt(data?.timeout) || 0;
                if (timeout > 0) {
                    const res = await stateMachineServer.setTemporary(data.path, data.value, timeout, validate)
                    if (typeof ack == 'function') {
                        ack(res)
                    }
                    return;
                }
            }

            const res = await stateMachineServer.set(data.path, data.value, validate)
            if (typeof ack == 'function') {
                ack(res)
            }
        });

        client.on('reset', async (data, ack) => {
            if (typeof data == 'string') {
                addLog('reset called - data should be an object string was given:', data)
                return;
            }
            showDataBytesUsageFromClient("reset", client, data);
            let validate = data.hasOwnProperty('validate') ? data.validate : true;
            if (useTempData) {
                const timeout = parseInt(data?.timeout) || 0;
                if (timeout > 0) {
                    let res = await stateMachineServer.resetTemporary(data.path, data.value, timeout, validate)
                    if (typeof ack == 'function') {
                        ack(res)
                    }
                    return;
                }
            }
            let res = await stateMachineServer.reset(data.path, data.value, validate)
            if (typeof ack == 'function') {
                ack(res)
            }
        });

        client.on('message', async (data, ack) => {
            if (typeof data == 'string') {
                addLog('reset called - data should be an object string was given:', data)
                return;
            }
            showDataBytesUsageFromClient("message", client, data);
            let res = stateMachineServer.message(data.path, data.value, data.save, (data.reset === true))
            if (typeof ack == 'function') {
                ack(res)
            }
        });
        client.on('clear', async (data, ack) => {
            if (typeof data == 'string') {
                addLog('clear called - data should be an object string was given:', data)
                return;
            }
            showDataBytesUsageFromClient("clear", client, data);
            stateMachineServer.clear();
            if (typeof ack == 'function') {
                ack(true)
            }
        });



        client.on('get', (data, ack) => {
            if (typeof data == 'string') {
                addLog('get called - data should be an object string was given:', data)
                return;
            }
            showDataBytesUsageFromClient("get", client, data);
            stateMachineServer.get(data.path).then((data) => {
                if (typeof ack == 'function') {
                    ack(data)
                }
            })

        });

        client.on('delete', (data, ack) => {
            if (typeof data == 'string') {
                addLog('delete called - data should be an object string was given:', data)
                return;
            }
            showDataBytesUsageFromClient("delete", client, data);
            stateMachineServer.delete(data.path).then((data) => {
                if (typeof ack == 'function') {
                    ack(data)
                }
            })

        });

        client.on('addListener', (data, ack) => {

            if (typeof data == 'string') {
                addLog('addListener called - data should be an object string was given:', data)
                try {
                    if (typeof data == "string") {
                        data = JSON.parse(data);
                    }
                } catch (e) {
                    addLog("cant parser string given");
                    return;
                }
            }
            if (!data.listener.hasOwnProperty('property') && data.listener.hasOwnProperty('path')) {
                data.listener.property = data.listener.path;
            }
            if (!data.listener.hasOwnProperty('path') && data.listener.hasOwnProperty('property')) {
                data.listener.path = data.listener.property;
            }
            let res = stateMachineServer.addListener(data, client)

            if (!data.hasOwnProperty('ignorePreviousData')) {
                stateMachineServer.get(data.listener.path).then((value) => {
                    if (value != null) {
                        client.emit(data.handler.method, value)
                    }
                });
            }

            if (typeof ack == 'function') {
                ack(res)
            }
        });

        client.on('addMessageListener', (data, ack) => {

            if (typeof data == 'string') {
                addLog('addMessageListener called - data should be an object string was given:', data)
                try {
                    if (typeof data == "string") {
                        data = JSON.parse(data);
                    }
                } catch (e) {
                    addLog("cant parser string given");
                    return;
                }
            }
            if (!data.listener.hasOwnProperty('property') && data.listener.hasOwnProperty('path')) {
                data.listener.property = data.listener.path;
            }
            if (!data.listener.hasOwnProperty('path') && data.listener.hasOwnProperty('property')) {
                data.listener.path = data.listener.property;
            }
            let res = stateMachineServer.addMessageListener(data, client)

            if (typeof ack == 'function') {
                ack(res)
            }
        });

        client.on('rmListener', (data, ack) => {
            if (typeof data == 'string') {
                addLog('removeListener called - data should be an object string was given:', data)
                try {
                    if (typeof data == "string") {
                        data = JSON.parse(data);
                    }
                } catch (e) {
                    addLog("cant parser string given");
                    return;
                }
            }

            let res = stateMachineServer.removeListener(data, client)
            if (typeof ack == 'function') {
                ack(res)
            }
        });

        client.on('removeMessageListener', (data, ack) => {
            if (typeof data == 'string') {
                addLog('removeListener called - data should be an object string was given:', data)
                try {
                    if (typeof data == "string") {
                        data = JSON.parse(data);
                    }
                } catch (e) {
                    addLog("cant parser string given");
                    return;
                }
            }

            let res = stateMachineServer.removeMessageListener(data, client)
            if (typeof ack == 'function') {
                ack(res)
            }
        });

        client.on('removeAllListener', (ack) => {

            let res = stateMachineServer.removeAllListener(client)
            if (typeof ack == 'function') {
                ack(res)
            }
        });
        let clientIp = client.request.connection.remoteAddress;
        client.emit("connectionEstabilished", JSON.stringify({ client: client.id, countConnections, clientIp }));
        countConnections++;
    });
    stateMachineServer.onClear.add(this.sendClearExecuted)
}

module.exports = IoServer;
