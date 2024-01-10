const fs = require('fs');
const http = require('http');
const https = require('https')
const cors = require('cors')
const bodyParser = require("body-parser");

function HttpServer(stateMachineServer, httpConfig = null, httpsConfig = {}, _useTempData = true) {
    const useTempData = _useTempData;
    const express = require('express');
    const app = express();
    let httpPort = httpConfig?.port

    let httpsPort = httpsConfig?.port
    let privateKey = (httpsConfig?.key) ? fs.readFileSync(httpsConfig?.key, 'utf8') : null
    let certificate = (httpsConfig?.cert) ? fs.readFileSync(httpsConfig?.cert, 'utf8') : null
    const credentials = { key: privateKey, cert: certificate };
    let httpServer = http.createServer(app);
    let httpsServer = (credentials.key && credentials.cert) ? https.createServer(credentials, app) : null
    this.getHttpServer = () => {
        return httpServer;
    }
    this.getHttpsServer = () => {
        return httpsServer;
    }
    app.use(bodyParser.json({ limit: "50mb" }));
    app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
    app.use(cors())
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    this.start = () => {
        if (httpPort && httpServer) {
            httpServer.listen(httpPort, () => {
                console.log("HTTP server started on httpPort " + httpPort);
            })
        }
        if (httpsPort && httpsServer) {
            httpsServer.listen(httpsPort, () => {
                console.log("HTTPS server started on httpsPort " + httpsPort);
            })
        }
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
    const httpDelete = (req, res) => {
        stateMachineServer.delete(req.body.path).then((r) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(r));
        });
    }
    // REST
    app.get('/', httpGet);
    app.post('/', httpPost);
    app.put('/', httpPut);
    app.delete('/', httpDelete);

    //named functions
    app.get('/ping', (req, res) => {
        res.json({ success: true, info: stateMachineServer.getInfo() });
    });
    app.get('/get', httpGet);

    app.post('/set', httpPost);

    app.post('/reset', httpPut);

    app.post('/message', (req, res) => {
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
    });
    app.post('/delete', httpDelete);

    app.post('/clear', (req, res) => {
        stateMachineServer.clear();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
    });
}

module.exports = HttpServer;