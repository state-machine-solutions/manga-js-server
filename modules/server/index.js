'use strict';
//this line void error: (node:10720) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 connect listeners added to [Socket]. Use emitter.setMaxListeners() to increase limit
require('events').EventEmitter.prototype._maxListeners = 0;

const {MangaCore} = require('@manga-js/manga-js-core');
const IoServer = require('./modules/IoServer')
const HttpServer = require('./modules/HttpServer')
const IOClientKMock = require('./modules/data/IOClientKMock')


function SMSCore(config = null) {
  var me = this;
  var ioPort = config?.connections?.io
  this.sms = new MangaCore({});
  this.io = null
  this.http = null
  if(config?.connections?.http || config?.connections?.https){
    this.http = new HttpServer(this.sms, config?.connections?.http, config?.connections?.https);
  }
  if(ioPort){
    this.io = new IoServer(this.sms, this.http, config?.connections?.cors);
    this.io.measureBytes = (config && config.measureBytes) ? true : false;
  }
  this.startHttp = _ => {
    me.http.start();
  }

  this.startSocket = _ => {
    if(!me.io){
      return;
    }
    me.io.start(ioPort);
  }

  this.addListener = (path, callback, updateMode) => {
    var listenerOb = {
      "listener": {
        "property": path
      },
      "handler": {
        "method": path

      }
    };
    if (updateMode) {
      listenerOb.listener.updateMode = updateMode;
    }
    var mockClient = new IOClientKMock(callback);
    me.sms.addListener(listenerOb, mockClient);
    return mockClient;
  }


  this.addMessageListener = (path,callBack)=>{
    var listenerOb = {
      "listener": {
        "property": path
      },
      "handler": {
        "method": path

      }
    };
    
    var mockClient = new IOClientKMock(callBack);
    me.sms.addMessageListener(listenerOb, mockClient);
    return mockClient;
  }


  this.addOnChangeLength = (_property, callBack) => {
    this.addListener(_property, callBack, "onChangeLength");
  }

  function instanceDataFilter(data) {
    if (data.constructor.name == "Object") {
      return data;
    }
    var r = {};
    Object.assign(r, data);
    return r;
  }
  this.get = me.sms.get;
  this.removeMessageListener = (path,client)=>{
    me.sms.removeMessageListener({path},instanceDataFilter(client));
  }
  this.removeListener = (path,client)=>{me.sms.removeListener({path},instanceDataFilter(client))};

  this.set = (path, value, validate = true, dispatchEvent = true) => {
    me.sms.set(path, instanceDataFilter(value), validate, dispatchEvent)
  };

  this.reset = (path, value, validate = true, dispatchEvent = true) => {
    me.sms.reset(path, instanceDataFilter(value), validate, dispatchEvent)
  };

  this.message = (path, value, save = false, reset = false) => {
    me.sms.message(path, instanceDataFilter(value), save, reset)
  };

  this.setValidateFN = (fn) => {
    this.sms.setValidateFN(fn);
  }

}
module.exports = SMSCore;
