require('dotenv').config();
const packageInfo = require('../package.json');

const appName = process.env.APP_NAME || packageInfo.name
let version = ' v.' + packageInfo.version;

const ioPort = process.env.IO_PORT || 8000
let httpPort = process.env.HTTP_PORT || 80
let httpsPort = process.env.HTTPS_PORT || 443
let httpsKey = process.env.HTTPS_KEY || null
let httpsCert = process.env.HTTPS_CERT || null
const configInfo = {
  appName,
  version,
  connections: {
    http: {
      port: httpPort,
      permissions: {
        ping: true,
        get: true,
        set: true,
        reset: true,
        message: true,
        delete: true,
        clear: true
      }
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
  },
  useTempData: process.env.USE_TEMP_DATA || false
}

module.exports = configInfo;