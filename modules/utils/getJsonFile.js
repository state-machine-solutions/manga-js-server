const path = require ('path');
const fs = require('fs');
function GetJsonFile(file){
    console.log( 'GetJsonFile >'+ file); 
    if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    }

    if( file.indexOf('./') == 0 ){
        file = file.replace('./','');
        file = path.resolve(path.dirname(process.execPath), file);
        return GetJsonFile(file);
    }
    return null;
    
}

module.exports = GetJsonFile;