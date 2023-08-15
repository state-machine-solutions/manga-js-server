'use strict';
let fs = require('fs');
const SMSCore = require('./modules/server');
const AutoSave = require('./modules/AutoSave')

require('dotenv').config()

// Reading initial data
const packageInfo = require('./package.json');

const appName = process.env.APP_NAME || packageInfo.name

let initialData = process.env.INITIAL_DATA;
if (typeof initialData == "string") {
  //if is string, it is the path to another config
  if (fs.existsSync(initialData)) {
    initialData = JSON.parse(fs.readFileSync(initialData, 'utf8'));
  }
}

let version = ' v.' + packageInfo.version;
let d = require('panel-log');
d.appName = appName;
d.appVersion = version;
d.setPercentComplete(1);
if (!process.env.hidePanel) {
  d.start();
}

const ioPort = process.env.IO_PORT || 8000
let httpPort = process.env.HTTP_PORT || 80
let httpsPort = process.env.HTTPS_PORT || 443
let httpsKey = process.env.HTTPS_KEY || null
let httpsCert = process.env.HTTPS_CERT || null
const configInfo = {
  appName,
  connections: {
    http: {
      port: httpPort
    },
    https: {
      port: httpsPort,
      key: httpsKey,
      cert: httpsCert
    },
    io: {
      port: ioPort,
      auth: {
        username: process.env.IO_AUTH_USERNAME || null,
        password: process.env.IO_AUTH_PASSWORD || null
      }
    },
    cors: {
      origin: "*"
    }
  },
  attached: [],
  initialData: process.env.INITIAL_DATA || './initialData.json',
  hidePanel: process.env.HIDE_PANEL || false,
  measureBytes: false,
  autoSave: {
    frequencyMinutes: process.env.AUTO_SAVE_FREQUENCE || 0
  }
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
  io.start(ioPort);
}
if (http) {
  http.start();
}

d.addItem(0, 1, "Validation", 100, (data) => {
  return "deprecated"
})
d.addItem(0, 0, "Status", 20, (data) => {
  return ""
})

d.addItem(1, 0, "ioPort", 15, ioPort | "blocked")
let portInfo = (httpPort && http.getHttpServer()) ? httpPort : "blocked"
portInfo += "/"
portInfo += (httpsPort && http.getHttpsServer()) ? httpsPort : "blocked"

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
d.addItem(1, 5, "reset/set/get", 15, () => {
  return sms.getInfo().stats.reset + "/" + sms.getInfo().stats.sets + "/" + sms.getInfo().stats.gets
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
