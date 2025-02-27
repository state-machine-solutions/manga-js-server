'use strict';
const SMSCore = require('./modules/server');
const configInfo = require("./config/configFromEnv");

let d = require('panel-log');

const smsCore = new SMSCore(configInfo);

d.appName = configInfo.appName;
d.appVersion = configInfo.version;
d.setPercentComplete(1);
if (!configInfo.hidePanel) {
  d.start();
}

smsCore.start();

d.addItem(0, 0, "reset", 10, () => {
  return smsCore.sms.getInfo().stats.reset
})
d.addItem(0, 1, "set", 10, () => {
  return smsCore.sms.getInfo().stats.sets
})
d.addItem(0, 2, "get", 10, () => {
  return smsCore.sms.getInfo().stats.gets
})
d.addItem(0, 3, "garbage (tic/del)", 22, () => {
  return smsCore.sms.getInfo().stats.garbageTic + "/" + smsCore.sms.getInfo().stats.garbageDeletes
});

let currentLine = 2;
for (let i = 0; i < configInfo.connections.length; i++) {
  let conn = configInfo.connections[i];
  d.addItem(currentLine, 0, "Conn Type", 10, conn.type);
  d.addItem(currentLine, 1, "Port", 10, conn.port);
  d.addItem(currentLine, 2, "Permissions", 25, `${conn.permissions}`);
  d.addItem(currentLine, 3, "Permissions", 25, `${conn.permissions}`);
  d.addItem(currentLine, 4, "Checkins", 15, () => {
    return conn.type == "io" ? conn.instance.getCheckinClientsTotal() : "none"
  })
  d.addItem(currentLine, 5, "Connecteds", 15, () => {
    return conn.type == "io" ? conn.instance.getConnectedClientsTotal() : "disable"
  })
  currentLine++;
}

d.addItem(currentLine, 1, "Listeners", 15, () => {
  return smsCore.sms.getInfo().stats.listeners
})


d.onUpdate.add(() => {
  console.log(d.newLineString);
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

  for (let i = 0; i < configInfo.connections.length; i++) {
    let conn = configInfo.connections[i];
    if (conn.type == "io") {
      const io = conn.instance;
      let loggeds = io ? io.getLoggedNames() : null;
      let connecteds = io ? io.getConnectedClients() : [];
      let colors = a[d.color.yellow, d.color.blueBright, d.color.green, d.color.red];
      let j = 0;


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
    }
  }
});
