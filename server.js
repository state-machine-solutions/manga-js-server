'use strict';
var fs = require('fs');
var path = require('path');
const getJsonFile = require('./modules/utils/getJsonFile')
const SMSCore = require('./modules/server') ;
const AutoSave = require('./modules/AutoSave')
const Validation = require('./modules/Validation')
const minimist = require('minimist');
var args = minimist(process.argv.slice(2), {  
    alias: {
        h: 'httpPort',
		    i: 'ioPort',
        c: 'config',
        v: 'validation',
        n: 'appName'
    }
});
//### Lendo dados iniciais e config
var configPath = args.config?args.config:"./config.json";
var packageInfo = require('./package.json') ;

var configInfo = getJsonFile(configPath) || {};
let appName = args.appName || configInfo.appName || packageInfo.name
var initialData = configInfo.initialData;
if(typeof initialData == "string"){
  //if is string, is the path to another config
  if( fs.existsSync( initialData ) ){
    initialData = JSON.parse(fs.readFileSync( initialData , 'utf8'));
  }
}
var validationPath = '';
if( configInfo.hasOwnProperty('validation') )
{
  validationPath = configInfo.validation;
}
var defaultValidation =   './validation.json';
validationPath = args.validation?args.validation:defaultValidation;
var validationRules = getJsonFile(validationPath) || {};


var version =   ' v.' + packageInfo.version ;
var d = require('panel-log') ;
d.appName = appName;
d.appVersion = version;
d.setPercentComplete(1) ;
if(!configInfo.hidePanel){
  d.start() ;
}

const DEFAULT_IO_SERVER_PORT = configInfo?.connections?.io?.port 
const DEFAULT_HTTP_SERVER_PORT = configInfo?.connections?.http?.port;
const DEFAULT_HTTPS_SERVER_PORT = configInfo?.connections?.https?.port;
var ioPort = args.ioPort ? args.ioPort : DEFAULT_IO_SERVER_PORT ; 
var httpPort = args.httpPort ? args.httpPort : DEFAULT_HTTP_SERVER_PORT ; 
var httpsPort = args.httpsPort ? args.httpsPort : DEFAULT_HTTPS_SERVER_PORT ; 
if( configInfo?.connections?.io?.port ) configInfo.connections.io.port =  ioPort
if( configInfo?.connections?.http?.port ) configInfo.connections.http.port =  httpPort
if( configInfo?.connections?.https?.port ) configInfo.connections.https.port =  httpsPort
var smsCore = new SMSCore(configInfo) ;

if( configInfo?.autoSave?.frequencyMinutes > 0 ){
  new AutoSave(smsCore, configInfo.initialData, configInfo.autoSave.frequencyMinutes)
}
var validation = new Validation(validationRules);
smsCore.setValidateFN(validation.validate);

let sms = smsCore.sms;
let io = smsCore.io;
let http = smsCore.http;
if(initialData && typeof(initialData)=='object'){
  setInitialData(initialData);
}
function setInitialData(data){
  for( var i in data){
    sms.set(i, data[i], false );
  }
}
if(io){
  io.start( ioPort );
}
if(http){
  http.start();
}

var hasValidation = (Object.keys(validationRules).length > 0);
d.addItem(0, 1, "Validation", 100, (data)=>{
  data.color = [ hasValidation ? d.color.green : d.color.red ]
  return (hasValidation ? "Using":"Not Found"+ ` ${validationPath}`)
})
d.addItem(0, 0, "Status", 20, (data)=>{
  data.color = [validation.getStatus()=='OK'?d.color.green:d.color.red]
  return validation.getStatus()
})

d.addItem(1, 0, "ioPort", 15, ioPort|"blocked")
let portInfo = (httpPort && http.getHttpServer())?httpPort : "blocked"
    portInfo += "/"
    portInfo += (httpsPort && http.getHttpsServer())?httpsPort:"blocked"

d.addItem(1, 1, "http/https", 15, portInfo)
d.addItem(1, 2, "Checkins", 15, ()=>{
  return io?io.getCheckinClientsTotal():"disable"
})
d.addItem(1, 3, "Connecteds", 15, ()=>{
  return io?io.getConnectedClientsTotal():"disable"
})
d.addItem(1, 4, "Listeners", 15, ()=>{
  return sms.getInfo().stats.listeners
})
d.addItem(1, 5, "reset/set/get", 15, ()=>{
  return sms.getInfo().stats.reset+"/"+sms.getInfo().stats.sets+"/"+sms.getInfo().stats.gets
})
d.addItem(1, 6, "Bytes last sec", 15, ()=>{
  return io?io.stats.partialBytes:"disable"
})
d.addItem(1, 7, "Bytes TOTAL", 15, ()=>{
  return io?io.stats.totalBytes:"disable"
})

d.onUpdate.add(()=>{
console.log(d.newLineString) ;
  var loggeds = io?io.getLoggedNames() : null;
  var connecteds = io?io.getConnectedClients() : [];
  var colors = [d.color.yellow, d.color.blueBright, d.color.green, d.color.red] ;
  var j = 0 ;
  var headers = new d.Line()
  .padding(2)
  .column('Name', 30, [d.color.cyan])
  .column('id', 25, [d.color.cyan])
  .column('Date In', 20, [d.color.cyan])
  .column('Sents', 8, [d.color.cyan])
  .column('Bytes last sec', 20, [d.color.cyan])
  .column('Bytes TOTAL', 30, [d.color.cyan])
  .fill()
  .output();

  connecteds.forEach(( client, key )=>{
    var loggedName = loggeds.has(key) ? " "+loggeds.get(key)+" " : " No Name    " ;
    j = Math.abs(j-1);
    var bg = j == 1 ? d.color.bgBlue: d.color.bgYellowBright ;
    var cor = j == 1 ? d.color.yellowBright: d.color.blue ;
    var line = new d.Line()
    .padding(2)
    .column( loggedName, 30 , [ cor , d.color.bold, bg ] )
    .column( key, 25, [d.color.white]  )
    .column( client.dateIn.toLocaleString("pt-BR") , 20, [d.color.blue] )
    .column( client.messageCount , 8, [d.color.blue] )
    .column( client.partialBytes , 20, [d.color.blue] )
    .column( client.totalBytes , 30, [d.color.blue] )
    
    .fill()
    .output();
  }) ;
  console.log(d.newLineString+" IO Logs") ;
  if(io){
    for(var i = io.logs.length-1; i >= 0 && i > io.logs.length-10; i--){
        var log = io.logs[i] ;
        console.log.apply( null, log );
    }
  }
  console.log(d.newLineString) ;
}) ;
