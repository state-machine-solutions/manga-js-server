# Manga JS Server

![Manga.js Logo](https://github.com/state-machine-solutions/State-Machine-Solutions-Documentation/blob/main/manga_logo.png?raw=true)

## Overview

Manga JS Server is a **state machine server** designed for structured data management. It allows:

- **Real-time data updates** via `socket.io` listeners.
- **Inter-client messaging** with optional persistence.
- **Memcache-like functionality** for caching and session management.
- **Collision-free read/write operations** for distributed systems.
- **HTTP-based data access** (optional).

## Features

- **Real-time Listeners**: Clients can subscribe to data paths and receive instant updates.
- **Inter-client Messaging**: Supports socket-based messaging with optional persistence.
- **State Machine Management**: Efficient handling of system states.
- **Memcache & Session Storage**: Quick access to temporary and persistent data.
- **REST API Support**: Data access via HTTP.

---

## Installation (Docker)

### **1. Build the Docker Image**
Run the following command **once**:
```sh
sh build-docker.sh
```

### **2. Start the Server**
```sh
sh run-docker.sh
```

---

## Environment Configuration (`.env`)

```ini
# Server instance name (for identification only)
APP_NAME=Example

# HTTP Read-only API (Optional)
HTTP_READ_PORT=80
HTTP_READ_AUTH_API_TOKEN=abc123  # Authorization token (optional)

# HTTP Write API (Optional - enables /set, /reset, /delete)
HTTP_WRITE_PORT=81
HTTP_WRITE_AUTH_API_TOKEN=abc1234  # Authorization token (optional)

# WebSocket Read API (Optional - subscribe to data updates)
IO_READ_PORT=8000
IO_READ_AUTH_USERNAME=test2  # Authentication (optional)
IO_READ_AUTH_PASSWORD=pass2
IO_READ_JWT_CHECKER_URL="http://localhost:8002?token={jwt}"

# WebSocket Write API (Optional - modify data)
IO_WRITE_PORT=8001
IO_WRITE_AUTH_USERNAME=test2
IO_WRITE_AUTH_PASSWORD=pass2
IO_WRITE_JWT_CHECKER_URL="http://localhost:8002?token={jwt}"

# Initial data file
INITIAL_DATA=./initialData.json

# Auto-save frequency (in seconds)
AUTO_SAVE_FREQUENCE=10.1

# Debugging
HIDE_PANEL=true  # Set to false for container mode, true for local debugging

# Temporary data support (auto-expiring data)
USE_TEMP_DATA=true

# REST API base path
HTTP_REST_PATH="/rest"
```

---

## API Usage

### **1. RESTful API**

If `HTTP_REST_PATH` is set in `.env`, RESTful access is enabled:

#### **GET** (Retrieve data)
```http
GET http://localhost/rest/aa/bb/cc
```
Equivalent to:
```http
GET /get?path=aa.bb.cc
```

#### **POST** (Update data without overwriting existing values)
```http
POST http://localhost/rest/aa/bb/cc
```
Request Body:
```json
{
    "value": { "example": 1 }
}
```
Equivalent to:
```http
POST /set?path=aa.bb.cc
```

#### **PUT** (Reset data at a path, replacing existing values)
```http
PUT http://localhost/rest/aa/bb/cc
```
Request Body:
```json
{
    "value": { "example": 2 }
}
```
Equivalent to:
```http
POST /reset?path=aa.bb.cc
```

#### **DELETE** (Remove data)
```http
DELETE http://localhost/rest/aa/bb
```
Equivalent to:
```http
POST /delete?path=aa.bb
```

To clear all data:
```http
DELETE http://localhost/rest/
```
Equivalent to:
```http
POST /clear
```

---

### **2. API Methods**

#### **Check Server Status**
```http
GET /ping
```
Response:
```json
{
    "started": "2025-02-27T12:34:56Z",
    "stats": {
        "gets": 0,
        "sets": 0,
        "listeners": 0,
        "clear": 0,
        "delete": 0,
        "reset": 0,
        "message": 0
    }
}
```

#### **Retrieve Data**
```http
GET /get?path=my.data.points
```
Response:
```json
{
    "current": 43
}
```

#### **Update Data (Merge with existing values)**
```http
POST /set
```
Request Body:
```json
{
    "path": "my.data.points",
    "value": { "last": 12 }
}
```
Response:
```json
{
    "success": true
}
```
New Data Structure:
```json
{
    "current": 43,
    "last": 12
}
```

#### **Reset Data (Overwrite existing values)**
```http
POST /reset
```
Request Body:
```json
{
    "path": "my.data.points",
    "value": { "last": 12 }
}
```
Response:
```json
{
    "success": true
}
```
New Data Structure:
```json
{
    "last": 12
}
```

#### **Send Message to Clients**
```http
POST /message
```
Request Body:
```json
{
    "path": "notifications",
    "value": "New update available"
}
```
*Messages are only received by WebSocket clients.*

#### **Delete Data at a Path**
```http
POST /delete
```
Request Body:
```json
{
    "path": "my.data.points"
}
```

#### **Clear All Data**
```http
POST /clear
```

---

## WebSocket Integration

For WebSocket connectivity, use:
[manga-ts-socket-io-sdk](https://www.npmjs.com/package/manga-ts-socket-io-sdk)

Refer to the SDK documentation for connection details.

---

## Support & Contributions

### **Donate**
If this project helps you, consider donating:

[![Donate](https://www.paypal.com/donate/?hosted_button_id=TX922XCPET8QG)](https://www.paypal.com/donate/?hosted_button_id=TX922XCPET8QG)

![Donation QR Code](https://github.com/state-machine-solutions/State-Machine-Solutions-Documentation/blob/main/donations_QRcode.png?raw=true)

### **Documentation & Source Code**
Find the full documentation and source code on GitHub:

🔗 [GitHub Documentation](https://github.com/state-machine-solutions/State-Machine-Solutions-Documentation)

