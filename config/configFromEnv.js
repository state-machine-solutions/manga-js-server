require('dotenv').config();
const packageInfo = require('../package.json');

const appName = process.env.APP_NAME || packageInfo.name
let version = ' v.' + packageInfo.version;

const ioReadPort = process.env.IO_READ_PORT || 8000
const ioWritePort = process.env.IO_WRITE_PORT || ioReadPort + 1
let httpReadPort = process.env.HTTP_READ_PORT || 80
let httpWritePort = process.env.HTTP_WRITE_PORT || httpReadPort + 1
const connections = [];
if (httpReadPort) {
  connections.push({
    type: "http",
    port: httpReadPort,
    permissions: {
      ping: true,
      get: true,
      set: false,
      reset: false,
      message: false,
      delete: false,
      clear: false
    }
  })
}
if (httpWritePort) {
  connections.push({
    type: "http",
    port: httpWritePort,
    permissions: {
      ping: true,
      get: true,
      set: true,
      reset: true,
      message: true,
      delete: true,
      clear: true,
      addListener: true
    },
    auth: {
      username: process.env.AUTH_USERNAME || null,
      password: process.env.AUTH_PASSWORD
    }
  });
}
if (ioReadPort) {
  const auth = process.env.AUTH_USERNAME ? {
    username: process.env.AUTH_USERNAME,
    password: process.env.AUTH_PASSWORD
  } : null;
  connections.push({
    type: "io",
    port: ioReadPort,
    permissions: {
      ping: true,
      get: true,
      set: false,
      reset: false,
      message: false,
      delete: false,
      clear: false,
      addListener: true
    },
    auth
  });
}
const configInfo = {
  appName,
  version,
  connections,

  cors: {
    origin: "*"
  },
  attached: [],
  initialData: process.env.INITIAL_DATA || './initialData.json',
  hidePanel: process.env.HIDE_PANEL || true,
  measureBytes: false,
  autoSave: {
    frequencyMinutes: process.env.AUTO_SAVE_FREQUENCE || 0
  },
  useTempData: process.env.USE_TEMP_DATA || true
}

module.exports = configInfo;