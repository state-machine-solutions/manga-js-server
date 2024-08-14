
class AutoSave {
    constructor(smsCore, autoSaver) {
        const me = this;
        this.smsCore = smsCore;
        //check if autoSaver has saveData method
        if (!autoSaver.saveData) {
            throw new Error('autoSaver must have a saveData method');
        }
        this.autoSaver = autoSaver;
        this.frequencyMinutes = frequencyMinutes;
        this.hasChange = false;
        this.saving = false;
        this.smsCore.addListener('', (value) => {
            this.hasChange = true;
        }, 'onChange')
        this.interval = setInterval(async () => {
            me.saveData(await me.smsCore.get(""))
        }, this.frequencyMinutes * 60000)
    }
    async saveData(data) {
        if (!this.hasChange || this.saving) {
            return;
        }
        this.hasChange = false;
        this.saving = true;
        try {
            await this.autoSaver.saveData(JSON.stringify(data));
        } catch (e) {
            console.log('autosave error:', e);
        }
        this.saving = false;
    }
}

module.exports = AutoSave;