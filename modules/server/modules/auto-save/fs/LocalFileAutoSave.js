const fs = require('fs')
class LocalFileAutoSave {
    constructor(initialDataPath = './initialData.json') {
        this.initialDataPath = initialDataPath;
    }
    async saveData(data) {
        if (!this.hasChange) {
            return;
        }
        this.hasChange = false;
        try {
            fs.writeFileSync(this.initialDataPath, JSON.stringify(data));
        } catch (e) {
            console.log('autosave error:', e);
        }
    }
    async getData() {
        //if is string, it is the path to another config
        if (fs.existsSync(this.initialDataPath)) {
            return JSON.parse(fs.readFileSync(this.initialDataPath, 'utf8'));
        }
        return null;
    }
}

module.exports = LocalFileAutoSave;