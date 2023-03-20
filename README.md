# Manga JS Server

![manga.js logo](https://github.com/state-machine-solutions/State-Machine-Solutions-Documentation/blob/main/manga_logo.png?raw=true)

The purpose of this project is to create a state machine server to keep organized data and be able to add listeners with socket.io in specific paths and in addition to providing a possible form of messages between socket.io clients.

It's posible to dispose data by http protocol

## HTTP and HTTPS

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

### Methods

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

###  get

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
`post` '/'

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

`put` '/'
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
