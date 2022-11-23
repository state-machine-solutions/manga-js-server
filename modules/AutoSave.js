const fs = require('fs')
class AutoSave{
    constructor(smsCore, initialDataPath = './initialData.json', frequencyMinutes = 1){
        const me = this;
        this.initialDataPath = initialDataPath;
        this.smsCore = smsCore;
        this.frequencyMinutes = frequencyMinutes;
        this.hasChange = false;
        this.smsCore.addListener('', (value)=>{
            this.hasChange = true;
        }, 'onChange')
        this.interval = setInterval(async ()=>{
            me.saveData(await me.smsCore.get(""))
        }, this.frequencyMinutes*60000)
    }
    saveData(data){
        if(!this.hasChange){
            return;
        }
        this.hasChange = false;
        try{
            fs.writeFileSync(this.initialDataPath, JSON.stringify(data));
        } catch(e){
            console.log('autosave error:', e);
        }
    }
}

module.exports = AutoSave;