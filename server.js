'use strict';
let fs = require('fs');
const SMSCore = require('./modules/server');
const AutoSave = require('./modules/AutoSave')
const configInfo = require("./config/configFromEnv");

// Reading initial data
const packageInfo = require('./package.json');

let initialData = configInfo.initialData;
if (typeof initialData == "string") {
  //if is string, it is the path to another config
  if (fs.existsSync(initialData)) {
    initialData = JSON.parse(fs.readFileSync(initialData, 'utf8'));
  }
}

const httpPort = configInfo.connections.http.port;
let d = require('panel-log');
d.appName = configInfo.appName;
d.appVersion = configInfo.version;
d.setPercentComplete(1);
if (!configInfo.hidePanel) {
  d.start();
}



const smsCore = new SMSCore(configInfo);

if (configInfo?.autoSave?.frequencyMinutes > 0) {
  new AutoSave(smsCore, configInfo.initialData, configInfo.autoSave.frequencyMinutes)
}

let sms = smsCore.sms;
let io = smsCore.io;
let http = smsCore.http;
if (initialData && typeof (initialData) == 'object') {
  setInitialData(initialData);
}
function setInitialData(data) {
  for (let i in data) {
    sms.set(i, data[i], false);
  }
}
if (io) {
  io.start(configInfo.connections.io.port);
}
if (http) {
  http.start();
}

d.addItem(0, 0, "reset", 10, () => {
  return sms.getInfo().stats.reset
})
d.addItem(0, 1, "set", 10, () => {
  return sms.getInfo().stats.sets
})
d.addItem(0, 2, "get", 10, () => {
  return sms.getInfo().stats.gets
})
d.addItem(0, 3, "garbage (tic/del)", 22, () => {
  return sms.getInfo().stats.garbageTic + "/" + sms.getInfo().stats.garbageDeletes
})

d.addItem(1, 0, "ioPort", 15, configInfo.connections.io.port | "blocked")
let portInfo = (httpPort && http.getHttpServer()) ? httpPort : "blocked"


d.addItem(1, 1, "http/https", 15, portInfo)
d.addItem(1, 2, "Checkins", 15, () => {
  return io ? io.getCheckinClientsTotal() : "disable"
})
d.addItem(1, 3, "Connecteds", 15, () => {
  return io ? io.getConnectedClientsTotal() : "disable"
})
d.addItem(1, 4, "Listeners", 15, () => {
  return sms.getInfo().stats.listeners
})

d.addItem(1, 6, "Bytes last sec", 15, () => {
  return io ? io.stats.partialBytes : "disable"
})
d.addItem(1, 7, "Bytes TOTAL", 15, () => {
  return io ? io.stats.totalBytes : "disable"
})

d.onUpdate.add(() => {
  console.log(d.newLineString);
  let loggeds = io ? io.getLoggedNames() : null;
  let connecteds = io ? io.getConnectedClients() : [];
  let colors = [d.color.yellow, d.color.blueBright, d.color.green, d.color.red];
  let j = 0;
  let headers = new d.Line()
    .padding(2)
    .column('Name', 30, [d.color.cyan])
    .column('id', 25, [d.color.cyan])
    .column('Date In', 20, [d.color.cyan])
    .column('Sents', 8, [d.color.cyan])
    .column('Bytes last sec', 20, [d.color.cyan])
    .column('Bytes TOTAL', 30, [d.color.cyan])
    .fill()
    .output();

  connecteds.forEach((client, key) => {
    let loggedName = loggeds.has(key) ? " " + loggeds.get(key) + " " : " No Name    ";
    j = Math.abs(j - 1);
    let bg = j == 1 ? d.color.bgBlue : d.color.bgYellowBright;
    let cor = j == 1 ? d.color.yellowBright : d.color.blue;
    let line = new d.Line()
      .padding(2)
      .column(loggedName, 30, [cor, d.color.bold, bg])
      .column(key, 25, [d.color.white])
      .column(client.dateIn.toLocaleString("pt-BR"), 20, [d.color.blue])
      .column(client.messageCount, 8, [d.color.blue])
      .column(client.partialBytes, 20, [d.color.blue])
      .column(client.totalBytes, 30, [d.color.blue])

      .fill()
      .output();
  });
  console.log(d.newLineString + " IO Logs");
  if (io) {
    for (let i = io.logs.length - 1; i >= 0 && i > io.logs.length - 10; i--) {
      let log = io.logs[i];
      console.log.apply(null, log);
    }
  }
  console.log(d.newLineString);
});
