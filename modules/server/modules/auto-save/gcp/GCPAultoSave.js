const { Storage } = require('@google-cloud/storage');

class GPCAutoSave {
  constructor(bucketName, fileName, options = {}) {
    this.storage = new Storage({
      projectId: options.projectId || process.env.GCP_PROJECT_ID || undefined,
      keyFilename: options.keyFilename || process.env.GCP_KEY_FILENAME || undefined,
    });
    this.bucketName = bucketName;
    this.fileName = fileName;
  }

  async saveData(data) {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(this.fileName);
    await file.save(data, {
      contentType: 'application/json',
    });
    console.log('Data successfully saved to Google Cloud Storage.');
  }

  async getData() {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(this.fileName);
      const [data] = await file.download();
      return JSON.parse(data.toString());
    } catch (e) {
      console.log('getData error:', e);
      return null;
    }
  }
}

module.exports = GPCAutoSave;
