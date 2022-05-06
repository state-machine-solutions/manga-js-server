const MangaClient = require( "@manga-js/manga-js-client" ) ;
var config = {
    ip:"http://localhost",
    port:8000,
    appName:"Oi"
};
var reciver = new MangaClient(config);

let test = {
    onchanges:{
        value1:null,
        value2:null,
        value3:null
    },
    onset:{
        value1:null
    },
    onchangeLength:{
        list1:null,
        list2:null
    }
}
reciver.onConnect.add(()=>{
    console.log("=== RECIVER CONNECTED");
    reciver.addListenerOnChange("test.onchanges.value1", (value)=>{
        if(test.onchanges.value1 == value){
            console.log("addListenerOnChange works") ;
            return ;
        }
        console.log("addListenerOnChange 1 FAIL", test.onchanges.value1, value) ;
    }) ;
    reciver.addListenerOnChange("test.onchanges.value2", (value)=>{
        if(test.onchanges.value2 == value){
            console.log("addListenerOnChange works") ;
            return ;
        }
        console.log("addListenerOnChange 2 FAIL", test.onchanges.value2, value) ;
    }) ;
    reciver.addListenerOnSet("test.onset.value1", (value)=>{
        if(test.onset.value1 == value){
            console.log("addListenerOnChange works") ;
            return ;
        }
        console.log("addListenerOnSet FAIL", test.onset.value1, value) ;
    }) ;
    reciver.addListenerOnChangeLenth("test.onchangeLength.list1", (value)=>{
        if( test.onchangeLength.list1 == value.length ){
            console.log("addListenerOnChangeLength works") ;
            return ;
        }
        console.log("addListenerOnChangeLenth FAIL", test.onchangeLength.list1, value) ;
    }) ;
})
reciver.connect();

var sender = new MangaClient(config);
sender.onConnect.add(()=>{
    console.log("=== SENDER CONNECTED");
    setInterval(()=>{
        test.onchanges.value1 = Math.floor(Math.random()*4000) ;
        console.log("SET test.onchanges.value1", test.onchanges.value1)
        sender.set("test.onchanges.value1", test.onchanges.value1) ;
    },5000);
    setInterval(()=>{
        test.onchanges.value2 = Math.floor(Math.random()*4000) ;
        console.log("SET test.onchanges.value2", test.onchanges.value2)
        sender.reset("test.onchanges.value2", test.onchanges.value2) ;
    },4000);
    setInterval(()=>{
        test.onset.value1 = Math.floor(Math.random()*3) ;
        console.log("SET test.onset.value1", test.onset.value1)
        sender.set("test.onset.value1", test.onset.value1) ;
    },3000);
    setInterval(()=>{
        test.onchangeLength.list1 = Math.floor(Math.random()*10) ;
        console.log("reset test.onchangeLength.list1", test.onchangeLength.list1)
        sender.reset("test.onchangeLength.list1", Array(test.onchangeLength.list1).fill(1)) ;
    },3500);
}) ;
sender.connect() ;

