const fs = require('fs');
const http = require('http');
const https = require('https')

const express = require('express')
const bodyParser  =    require("body-parser");
const path = require('path');

function HttpServer ( stateMachineServer, httpConfig = null, httpsConfig){
    
    const express = require('express');
    const app = express();
    let httpPort = httpConfig?.port
    
    let httpsPort = httpsConfig?.port
    let privateKey  = (httpsConfig?.key) ? fs.readFileSync(httpsConfig?.key, 'utf8'): null
    let certificate = (httpsConfig?.cert) ? fs.readFileSync(httpsConfig?.cert, 'utf8'): null
    const credentials = {key: privateKey, cert: certificate};
    let httpServer = http.createServer(app);
    let httpsServer = (credentials.key && credentials.cert)?https.createServer(credentials, app): null
    this.getHttpServer = ()=>{
        return httpServer;
    }
    this.getHttpsServer = ()=>{
        return httpsServer;
    }
    app.use(bodyParser.json({limit: "50mb"}));
    app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
    app.use(function(err, req, res, next) {   
        if(err){
            //req.path
            const t = new Date();
            
            const message = " Error parsing data"+
            "\nrequest: " + req.path+
            "\nbody: " +   JSON.stringify( req.body )+
            "\n_________________________________________________________________________________________________ ";
            
            res.status(400).send('Error parsing data: ' + message );
            return;
        } 
        res.header("Access-Control-Allow-Credentials", true);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header("Access-Control-Allow-Origin", '*:*'); //<--
        res.header("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Accept, X-Access-Token, X-Application-Name, X-Request-Sent-Time, application/json,Authorization');
        next();
      });
    app.use(function(req, res, next) {    
        res.header("Access-Control-Allow-Credentials", true);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header("Access-Control-Allow-Origin", '*:*'); //<--
        res.header("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Accept, X-Access-Token, X-Application-Name, X-Request-Sent-Time, application/json,Authorization');
        next();
      });
      
    app.use(express.json({limit: '50mb'}));
    app.use(express.urlencoded({limit: '50mb', extended: true}));

    this.start = ( )=>{
        if(httpPort && httpServer){
            httpServer.listen(httpPort, ()=>{
                console.log("HTTP server started on httpPort " + httpPort);
            })
        }
        if(httpsPort && httpsServer){
            httpsServer.listen(httpsPort, ()=>{
                console.log("HTTPS server started on httpsPort " + httpsPort);
            })
        }
    }
    app.get('/ping', (req, res)=>{
        res.json({success:true, info:stateMachineServer.getInfo()});
    });
    app.get('/get',(req,res)=>{
        if(!req.query.hasOwnProperty('path')){
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({messages:["path is required"]}))
            return;
        }
        console.log( 'HTTP get : ' + req.query?.path)
        stateMachineServer.get( req.query.path ).then((data)=>{
            const result = JSON.stringify( data );
            res.setHeader('Content-Type', 'application/json');
            res.status(200).end( result );
        });
        
    });



    app.post('/set',(req,res)=>{
        if(!req.body.hasOwnProperty('path')){
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({messages:["path is required"]}))
            return;
        }
        if(!req.body.hasOwnProperty('value')){
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({messages:["value is required"]}))
            return;
        }
        stateMachineServer.set( req.body.path, req.body.value ).then((r)=>{
            res.setHeader('Content-Type', 'application/json');
            res.end( JSON.stringify(r) );
        }) ;
    });

    app.post('/reset',(req,res)=>{
        if(!req.body.hasOwnProperty('path')){
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({messages:["path is required"]}))
            return;
        }
        if(!req.body.hasOwnProperty('value')){
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({messages:["value is required"]}))
            return;
        }
        const milliseconds = new Date().getTime();
        stateMachineServer.reset( req.body.path, req.body.value )
        .then((r)=>{
            res.setHeader('Content-Type', 'application/json');
            res.end( JSON.stringify(r) );
        });
    });

    app.post('/message',(req,res)=>{
        //console.log( req.body );
        if(!req.body.hasOwnProperty('path')){
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({messages:["path is required"]}))
            return;
        }
        if(!req.body.hasOwnProperty('value')){
            res.setHeader('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({messages:["value is required"]}))
            return;
        }
        const save = req.body?.save || false;
        stateMachineServer.message( req.body.path, req.body.value, save ).then((r)=>{
            res.setHeader('Content-Type', 'application/json');
            res.end( JSON.stringify(r) );
        }) ;
    });
    app.get('/validate',(req,res)=>{
        console.log( 'HTTP validate : ' + req.query.path)
        const p = req.query.path || "";
        const data = stateMachineServer.validate( p ).then((data)=>{
            const result = JSON.stringify( data );
            res.setHeader('Content-Type', 'application/json');
            res.end( result );
       });       
    });

    app.post('/delete',(req,res)=>{
        //console.log( req.body );
        stateMachineServer.delete( req.body.path ).then((r)=>{
            res.setHeader('Content-Type', 'application/json');
            res.end( JSON.stringify(r) );
        }) ;
    });

    app.post('/clear',(req,res)=>{
        //console.log( req.body );
        stateMachineServer.clear();
        res.setHeader('Content-Type', 'application/json');
        res.end( JSON.stringify({success:true}) );
    
        
    });
    app.get('/debug/listeners',(req,res)=>{
        //console.log( req.body );
        const r = stateMachineServer.getListeners() ;
        res.setHeader('Content-Type', 'application/json');
        res.end( JSON.stringify(r) );
    });
 
}

module.exports = HttpServer;