const MangaClient = require("@manga-js/manga-js-client");
var config = {
    appName: "Hello World Client Example",
    ip: "http://localhost",
    port: 8001,
    auth: {
        username: "test2",
        password: "pass2"
    }
};
var receiver = new MangaClient(config);

let test = {
    receiver: {
        connected: false,
    },
    sender: {
        connected: false
    },
    onchanges: {
        value1: null,
        value2: null,
        value3: null
    },
    onset: {
        value1: null
    },
    onchangeLength: {
        list1: null,
        list2: null
    }
}
receiver.onDisconnect.add((e) => {
    test.receiver.connected = false
    console.log("Receiver Disconnected", e)
})
receiver.onConnect.add(() => {
    test.connected = true
    console.log("=== receiver CONNECTED");
    receiver.addListenerOnChange("test.onchanges.value1", (value) => {
        if (test.onchanges.value1 == value) {
            console.log("addListenerOnChange works");
            return;
        }
        console.log("addListenerOnChange 1 FAIL", test.onchanges.value1, value);
    });
    receiver.addListenerOnChange("test.onchanges.value2", (value) => {
        if (test.onchanges.value2 == value) {
            console.log("addListenerOnChange works");
            return;
        }
        console.log("addListenerOnChange 2 FAIL", test.onchanges.value2, value);
    });
    receiver.addListenerOnSet("test.onset.value1", (value) => {
        if (test.onset.value1 == value) {
            console.log("addListenerOnChange works");
            return;
        }
        console.log("addListenerOnSet FAIL", test.onset.value1, value);
    });
    receiver.addListenerOnChangeLenth("test.onchangeLength.list1", (value) => {
        if (test.onchangeLength.list1 == value.length) {
            console.log("addListenerOnChangeLength works");
            return;
        }
        console.log("addListenerOnChangeLenth FAIL", test.onchangeLength.list1, value);
    });

})
receiver.connect();

var sender = new MangaClient(config);
sender.onDisconnect.add(() => {
    console.log("SENDER DISCONNECTED")
    test.sender.connected = false
})
sender.onConnect.add(() => {
    test.sender.connected = true
    console.log("=== SENDER CONNECTED");
    setInterval(() => {
        if (!test.sender.connected) {
            console.log("not connected...")
            return
        }
        test.onchanges.value1 = Math.floor(Math.random() * 4000);
        console.log("SET test.onchanges.value1", test.onchanges.value1)
        sender.set("test.onchanges.value1", test.onchanges.value1);
    }, 5000);
    setInterval(() => {
        if (!test.sender.connected) {
            console.log("not connected...")
            return
        }
        test.onchanges.value2 = Math.floor(Math.random() * 4000);
        console.log("SET test.onchanges.value2", test.onchanges.value2)
        sender.reset("test.onchanges.value2", test.onchanges.value2);
    }, 4000);
    setInterval(() => {
        if (!test.sender.connected) {
            console.log("not connected...")
            return
        }
        test.onset.value1 = Math.floor(Math.random() * 3);
        console.log("SET test.onset.value1", test.onset.value1)
        sender.set("test.onset.value1", test.onset.value1);
    }, 3000);
    setInterval(() => {
        if (!test.sender.connected) {
            console.log("not connected...")
            return
        }
        test.onchangeLength.list1 = Math.floor(Math.random() * 10);
        console.log("reset test.onchangeLength.list1", test.onchangeLength.list1)
        sender.reset("test.onchangeLength.list1", Array(test.onchangeLength.list1).fill(1));
    }, 3500);
});
sender.connect();

