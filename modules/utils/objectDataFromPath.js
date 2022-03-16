function objectDataFromPath( obj, path ){
    if( path.length == 0 )
        return obj
        
    var nodes = path.split('.');
    //var pointer = obj;

    this.drillDown = ()=>{
        var node = nodes.shift()
        if( obj != undefined && obj.hasOwnProperty( node ) ){
            obj = obj[node];
            if( nodes.length == 0 ){
                return obj;
            }
            return this.drillDown()
        }else{
            return null;
        }
    }
    
    return this.drillDown();

}

module.exports = objectDataFromPath;