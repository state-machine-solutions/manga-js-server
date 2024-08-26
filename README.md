# Manga JS Server

![manga.js logo](https://github.com/state-machine-solutions/State-Machine-Solutions-Documentation/blob/main/manga_logo.png?raw=true)

The purpose of this project is to create a state machine server to keep organized data and be able to add listeners with socket.io in specific paths and in addition to providing a possible form of messages between socket.io clients.

It's posible to dispose data by http protocol

## Docker

To easy build you need to run once:

```
sh build-docker.sh
```

To run:

```
sh run-docker.sh
```

## ENV EXAMPLE

```
APP_NAME=Example
HTTP_READ_PORT=80
HTTP_READ_JWT_CHECKER_URL="http://localhost:8002?token={jwt}"
HTTP_READ_AUTH_API_TOKEN=abc123

HTTP_WRITE_PORT=81
HTTP_WRITE_JWT_CHECKER_URL="http://localhost:8002?token={jwt}"
HTTP_WRITE_AUTH_API_TOKEN=abc1234

IO_READ_PORT=8000
IO_READ_AUTH_USERNAME=test2
IO_READ_AUTH_PASSWORD=pass2
IO_READ_JWT_CHECKER_URL="http://localhost:8002?token={jwt}"

IO_WRITE_PORT=8001
IO_WRITE_AUTH_USERNAME=test2
IO_WRITE_AUTH_PASSWORD=pass2
IO_WRITE_JWT_CHECKER_URL="http://localhost:8002?token={jwt}"

INITIAL_DATA=./initialData.json
AUTO_SAVE_FREQUENCE=10.1

# make false to run on container, true to run on local machine and debug
HIDE_PANEL=true

# If it is true make possible to set temporary data that automatic vanish after a setted time
USE_TEMP_DATA=true
HTTP_REST_PATH="/rest"
```

## Overview

[Repository Overview](./repository-overview.md)

## HTTP

You can access api via http RESTFUL or API METHODS.

For all examples consider this data struture:

```
{
    my:{
        data:{
            points: {
                current:43
            },
            info:{
                name: "Test",
                keys: ["a", "b", { x: 1, y: 2 }]
            }
        }
    }
}
```

## RESTFUL

It's possible to configure a Restful start path on .env using `HTTP_REST_PATH="/rest"`

For all access data or save data in manga (less clear method), we need to know the `path`.
If you are using RESTFUL mode to access, the path come from url path.

for this url: `GET` `http://localhost/rest/aa/bb/cc`

The result will be get the value of path "aa.bb.cc".

| Notie: the HTTP_REST_PATH name will be removed from path to build a path.

`${serverUrl}${HTTP_REST_PATH}/your/path/here`

And it works for all of 5 actions of MangaServer to call:

### GET

Get data values from path.

for this url: `GET` `http://localhost/rest/aa/bb/cc`

The result will be get the value of path "aa.bb.cc".

| The same result of API METHOD /get?path=aa.bb.cc

### POST

RESET data values from path and with values inside a `body.value`.

for this url: `POST` `http://localhost/rest/aa/bb/cc`

Manga will consider the path path "aa.bb.cc".
And if you use the body value:

```
{
    "value":  {
        "example": 1
    }
}
```

Manga will merge data inside a path `aa.bb.cc` with the new sent data.

| The same result of API METHOD /set?path=aa.bb.cc

### PUT

RESET data values from path and with values inside a `body.value`.

for this url: `PUT` `http://localhost/rest/aa/bb/cc`

Manga will consider the path path "aa.bb.cc".
And if you use the body value:

```
{
    "value":  {
        "example": 2
    }
}
```

Manga will reset data inside a path `aa.bb.cc` with the new sent data. The data will be overwrited.

| The same result of API METHOD /reset?path=aa.bb.cc

### DELETE

Delete method can call two `delete` or `clear`.
If you do not send `path`, for exemple:

`DELETE` `http://localhost/rest/`

Manga Server will consider a `clear` method.

| The same result of API METHOD /clear

And if you send `path`, for example:

`DELETE` `http://localhost/rest/aa/bb`

Manga will delete all properties inside aa.bb and de `bb` attribute from aa object.

| The same result of API METHOD /delete?path=aa.bb

## API METHODS

`get` '/ping'

Just to check if server and shows server stats

```
{
    started: new Date(),
    stats:{
        gets:0,
        sets:0,
        listeners:0,
        clear:0,
        delete:0,
        reset:0,
        message:0
    }
}
```

### get

`get` '/get'
`get` '/'

params: `path`

To get values based in `path`

### Example:

`/get?path=my.data.points`

Result:

```
{
    "current":43
}
```

## set

`post` '/set'

To update value based on path, but merging with server values

### Example:

`/set`

Body:

```
{
    "path": "my.data.points",
    "value": {
        last: 12
    }
}
```

Return

```
{
    "success": true
}
```

After change the result of `my.data.points` will be:

```
{
    "current": 43,
    "last": 12
}
```

## reset

`post` '/reset'

The same as `/set` but overwrite server value

### Example:

`/reset`

Body:

```
{
    "path": "my.data.points",
    "value": {
        last: 12
    }
}
```

Return

```
{
    "success": true
}
```

After change the result of `my.data.points` will be:

```
{
    "last": 12
}
```

The `current` all values will be lost

## message

`post` '/message'

Body Params:

```
{
    path:string, value:any
}
```

Message do not save data. But if some client was connected by socket.io, they will receive the message sent by this method.

| There is no http listener clients. Is not possible to receive messages by http

## delete

`post` '/delete'
`delete` '/'

Body:

```
{ path: string }
```

Remove data based on path

## clear

`post` '/clear'

Delete all data on server

## Donate:

If this project helps you, please donate

https://www.paypal.com/donate/?hosted_button_id=TX922XCPET8QG

![donation qrcode image](https://github.com/state-machine-solutions/State-Machine-Solutions-Documentation/blob/main/donations_QRcode.png?raw=true)

## Documentation

See documentation on github

https://github.com/state-machine-solutions/State-Machine-Solutions-Documentation
