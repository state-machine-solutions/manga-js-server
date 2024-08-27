const http = require('http');
const cors = require('cors');
const configPermissions = require('../../utils/configPermissions');
const expressRateLimit = require('express-rate-limit');

function HttpServer(stateMachineServer, config = null) {
    const me = this;
    const useTempData = config?.useTempData === true;
    const express = require('express');
    const app = express();
    this.port = config?.port;
    this.config = config;
    const apiToken = config?.auth?.apiToken;
    const hasApiToken = !!apiToken;
    this.permissions = configPermissions(config?.permissions);
    this.permissions.addListener = false;
    const hasPermission = !!(config?.permissions);
    const httpServer = http.createServer(app);

    this.getHttpServer = () => httpServer;

    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    this.start = () => {
        if (me.port && httpServer) {
            httpServer.listen(me.port, () => {
                console.log("HTTP server started on httpPort " + me.port + " with permissions: " + me.permissions);
            });
        }
    };

    const httpPing = (req, res) => {
        res.json({ success: true, data: { info: stateMachineServer.getInfo(), permissions: me.permissions } });
    };

    const httpGet = (req, res) => {
        if (!req.query.hasOwnProperty('path')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).send({ messages: ["path is required"] });
            return;
        }
        console.log('HTTP get : ' + req.query?.path);
        stateMachineServer.get(req.query.path).then((data) => {
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify(data));
        });
    };

    const httpPost = (req, res) => {
        if (!req.body.hasOwnProperty('path')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).send({ messages: ["path is required"] });
            return;
        }
        if (!req.body.hasOwnProperty('value')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).send({ messages: ["value is required"] });
            return;
        }
        if (useTempData) {
            const timeout = parseInt(req.body?.timeout) || 0;
            if (timeout > 0) {
                stateMachineServer.setTemporary(req.body.path, req.body.value, timeout)
                    .then((r) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(r);
                    });
                return;
            }
        }
        stateMachineServer.set(req.body.path, req.body.value).then((r) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(r);
        });
    };

    const httpPut = (req, res) => {
        if (!req.body.hasOwnProperty('path')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).send({ messages: ["path is required"] });
            return;
        }
        if (!req.body.hasOwnProperty('value')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).send({ messages: ["value is required"] });
            return;
        }
        if (useTempData) {
            const timeout = parseInt(req.body?.timeout) || 0;
            if (timeout > 0) {
                stateMachineServer.resetTemporary(req.body.path, req.body.value, timeout)
                    .then((r) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(r);
                    });
                return;
            }
        }
        stateMachineServer.reset(req.body.path, req.body.value)
            .then((r) => {
                res.setHeader('Content-Type', 'application/json');
                res.send(r);
            });
    };

    const httpMessage = (req, res) => {
        if (!req.body.hasOwnProperty('path')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).send({ messages: ["path is required"] });
            return;
        }
        if (!req.body.hasOwnProperty('value')) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).send({ messages: ["value is required"] });
            return;
        }
        const save = req.body?.save || false;
        stateMachineServer.message(req.body.path, req.body.value, save).then((r) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(r);
        });
    };

    const httpDelete = (req, res) => {
        stateMachineServer.delete(req.body.path).then((r) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(r);
        });
    };

    const confirmationCode = {};
    const httpClear = (req, res) => {
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const clientIpNormalized = clientIp.replace(/[^a-zA-Z0-9]/g, '_');
        if (req.body?.confirmationCode) {
            if (confirmationCode[clientIpNormalized] === req.body.confirmationCode) {
                stateMachineServer.clear();
                res.setHeader('Content-Type', 'application/json');
                res.send({ success: true });
                return;
            }
        }
        const code = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
        confirmationCode[clientIpNormalized] = code;
        res.setHeader('Content-Type', 'application/json');
        res.status(403);
        res.send({ success: false, data: { confirmationCode: code }, messages: ["Confirm action sending the confirmation code"] });
    };

    const rateLimiter = expressRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.',
        statusCode: 429,
    });

    app.use(rateLimiter);
    const httpRestPath = config?.httpRestPath || '/rest';
    app.get(`${httpRestPath}/*`, restResolvePath(callOrDeny('get', httpGet)));
    app.post(`${httpRestPath}/*`, restResolvePath(callOrDeny('set', httpPost)));
    app.put(`${httpRestPath}/*`, restResolvePath(callOrDeny('reset', httpPut)));
    app.delete(`${httpRestPath}/*`, restResolvePath(callOrDeny('delete', httpDelete)));
    // app.delete(`${httpRestPath}/all`, restResolvePath(callOrDeny('delete', httpClear)));

    app.get('/ping', callOrDeny('ping', httpPing));
    app.get('/get', callOrDeny('get', httpGet));
    app.post('/set', callOrDeny('set', httpPost));
    app.post('/reset', callOrDeny('reset', httpPut));
    app.post('/message', callOrDeny('message', httpMessage));
    app.post('/delete', callOrDeny('delete', httpDelete));
    app.delete('/delete', callOrDeny('delete', httpDelete));
    app.post('/clear', callOrDeny('clear', httpClear));
    app.delete('/clear', callOrDeny('clear', httpClear));

    function denyMethod(req, res) {
        res.status(403).send({ success: false, messages: ["Method not allowed"] });
    }
    function restResolvePath(method) {
        return (req, res) => {
            let pathName = "body";
            if (req.method === 'GET') {
                pathName = "query";
            }

            req[pathName].path = req.url.replace(`${httpRestPath}/`, '').split("?")[0].replaceAll("/", ".");
            if (req.method === 'DELETE' && !req[pathName].path) {
                return httpClear(req, res);
            }
            return method(req, res);
        }
    }
    function callOrDeny(methodName, method) {
        if (hasApiToken) {
            return (req, res) => {
                const authToken = req.headers?.authorization?.replace('Bearer ', '');
                const apiTokenSent = req.headers?.api_token || authToken;
                if (apiTokenSent !== apiToken) {
                    res.status(403).send({ success: false, messages: ["Invalid token"] });
                    return;
                }
                if (checkPermission(methodName)) {
                    method(req, res);
                } else {
                    res.status(403).send({ success: false, messages: ["Method not allowed"] });
                }
            };
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
