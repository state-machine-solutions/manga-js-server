function IOClientKMock  (callback) {
    var date = new Date();
    this.id = date.getTime();
    this.emit = (m,value)=>{
        callback(value);
    };
    
}

module.exports = IOClientKMock;
  