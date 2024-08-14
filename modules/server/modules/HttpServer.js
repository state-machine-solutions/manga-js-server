const http = require('http');
const cors = require('cors')
const bodyParser = require("body-parser");
const configPermissions = require('../../utils/configPermissions');

function HttpServer(stateMachineServer, config = null) {
    const me = this;
    const useTempData = config?.useTempData == true;
    const express = require('express');
    const app = express();
    this.port = config?.port
    this.config = config;
    const apiToken = config?.apiToken;
    const hasApiToken = !!apiToken;
    this.permissions = configPermissions(config?.permissions);
    this.permissions.addListener = false;
    const hasPermission = !!(config?.permissions)
    const httpServer = http.createServer(app);

    this.getHttpServer = () => {
        return httpServer;
    }
    app.use(bodyParser.json({ limit: "50mb" }));
    app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
    app.use(cors())
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    this.start = () => {
        if (me.port && httpServer) {
            httpServer.listen(me.port, () => {
                console.log("HTTP server started on httpPort " + me.port + " with permissions: " + me.permissions);
            })
        }
    }
    const httpPing = (req, res) => {
        res.json({ success: true, info: stateMachineServer.getInfo() });
    }
    const httpGet = (req, res) => {
        if (!req.query.hasOwnProperty('path')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({ messages: ["path is required"] }))
            return;
        }
        console.log('HTTP get : ' + req.query?.path)
        stateMachineServer.get(req.query.path).then((data) => {
            const result = JSON.stringify(data);
            res.setHeader('Content-Type', 'application/json');
            res.status(200).end(result);
        });

    }
    const httpPost = (req, res) => {
        if (!req.body.hasOwnProperty('path')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({ messages: ["path is required"] }))
            return;
        }
        if (!req.body.hasOwnProperty('value')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({ messages: ["value is required"] }))
            return;
        }
        if (useTempData) {
            const timeout = parseInt(req.body?.timeout) || 0;
            if (timeout > 0) {
                stateMachineServer.setTemporary(req.body.path, req.body.value, timeout)
                    .then((r) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(r));
                    });
                return;
            }
        }
        stateMachineServer.set(req.body.path, req.body.value).then((r) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(r));
        });
    }
    const httpPut = (req, res) => {
        if (!req.body.hasOwnProperty('path')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({ messages: ["path is required"] }))
            return;
        }
        if (!req.body.hasOwnProperty('value')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({ messages: ["value is required"] }))
            return;
        }
        if (useTempData) {
            const timeout = parseInt(req.body?.timeout) || 0;
            if (timeout > 0) {
                stateMachineServer.resetTemporary(req.body.path, req.body.value, timeout)
                    .then((r) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(r));
                    });
                return;
            }
        }
        stateMachineServer.reset(req.body.path, req.body.value)
            .then((r) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(r));
            });
    }
    const httpMessage = (req, res) => {
        if (!req.body.hasOwnProperty('path')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({ messages: ["path is required"] }))
            return;
        }
        if (!req.body.hasOwnProperty('value')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({ messages: ["value is required"] }))
            return;
        }
        const save = req.body?.save || false;
        stateMachineServer.message(req.body.path, req.body.value, save).then((r) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(r));
        });
    }
    const httpDelete = (req, res) => {
        stateMachineServer.delete(req.body.path).then((r) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(r));
        });
    }
    const httpClear = (req, res) => {
        stateMachineServer.clear();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
    }
    // REST
    app.get('/', httpGet);
    app.post('/', httpPost);
    app.put('/', httpPut);
    app.delete('/', httpDelete);

    //named functions
    app.get('/ping', callOrDeny('ping', httpPing));
    app.get('/get', callOrDeny('get', httpGet));
    app.post('/set', callOrDeny('set', httpPost));
    app.post('/reset', callOrDeny('reset', httpPut));
    app.post('/message', callOrDeny('message', httpMessage));
    app.post('/delete', callOrDeny('delete', httpDelete));
    app.post('/clear', callOrDeny('clear', httpClear));

    function denyMethod(req, res) {
        res.status(403).send({ success: false, messages: ["Method not allowed"] });
    }
    function callOrDeny(methodName, method) {
        if (hasApiToken) {
            return (req, res) => {
                const authToken = req.headers?.authorization?.replace('Bearer ', '');
                const apiToken = req.headers?.api_token || authToken;
                if (req.headers?.api_token !== apiToken) {
                    res.status(403).send({ success: false, messages: ["Invalid token"] });
                    return;
                }
                if (checkPermission(methodName)) {
                    method(req, res);
                } else {
                    res.status(403).send({ success: false, messages: ["Method not allowed"] });
                }
            }
        }
        if (checkPermission(methodName)) {
            return method;
        }
        return denyMethod;
    }
    function checkPermission(methodName) {
        if (!hasPermission) {
            return true;
        }
        return me.permissions[methodName] === true;
    }
}


module.exports = HttpServer;