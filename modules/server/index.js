'use strict';
//this line void error: (node:10720) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 connect listeners added to [Socket]. Use emitter.setMaxListeners() to increase limit
require('events').EventEmitter.prototype._maxListeners = 0;

const { MangaCore } = require('@manga-js/manga-js-core');
const IoServer = require('./modules/IoServer')
const HttpServer = require('./modules/HttpServer')
const IOClientKMock = require('./modules/data/IOClientKMock')
const LocalFileAutoSave = require('./modules/auto-save/fs/LocalFileAutoSave')
const fs = require('fs');
const classes = {
  http: HttpServer,
  io: IoServer
}
function SMSCore(config = null) {
  const me = this;
  this.sms = new MangaCore({});
  this.connections = config?.connections;
  config?.connections?.forEach(c => {
    if (classes[c.type]) {
      c.instance = new classes[c.type](this.sms, c);
    }
  });

  let initialData = config.initialData;
  if (typeof initialData == "string") {
    //if is string, it is the path to another config
    if (fs.existsSync(initialData)) {
      initialData = JSON.parse(fs.readFileSync(initialData, 'utf8'));
    }
  }
  if (initialData && typeof (initialData) == 'object') {
    setInitialData(initialData);
  }


  this.start = _ => {
    me.connections.forEach(c => {
      c.instance.start();
    });
  }
  this.addListener = (path, callback, updateMode) => {
    const listenerOb = {
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
    const mockClient = new IOClientKMock(callback);
    me.sms.addListener(listenerOb, mockClient);
    return mockClient;
  }


  this.addMessageListener = (path, callBack) => {
    const listenerOb = {
      "listener": {
        "property": path
      },
      "handler": {
        "method": path

      }
    };

    const mockClient = new IOClientKMock(callBack);
    me.sms.addMessageListener(listenerOb, mockClient);
    return mockClient;
  }


  this.addOnChangeLength = (_property, callBack) => {
    me.addListener(_property, callBack, "onChangeLength");
  }

  function instanceDataFilter(data) {
    if (data.constructor.name == "Object") {
      return data;
    }
    const r = {};
    Object.assign(r, data);
    return r;
  }
  this.get = me.sms.get;
  this.removeMessageListener = (path, client) => {
    me.sms.removeMessageListener({ path }, instanceDataFilter(client));
  }
  this.removeListener = (path, client) => { me.sms.removeListener({ path }, instanceDataFilter(client)) };

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
  function setInitialData(data) {
    for (let i in data) {
      me.sms.reset(i, data[i], false);
    }
  }
  if (config?.autoSave?.frequencyMinutes > 0) {
    new LocalFileAutoSave(this, config.initialData, config.autoSave.frequencyMinutes)
  }
}
module.exports = SMSCore;