const AWS = require('aws-sdk');

class S3AutoSave {
  constructor(bucketName, keyName, options = {}) {
    AWS.config.update({
      accessKeyId: options.accessKeyId || process.env.AWS_ACCESS_KEY_ID || undefined,
      secretAccessKey: options.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || undefined,
      region: options.region || process.env.AWS_REGION || 'us-east-1'
    });
    this.s3 = new AWS.S3();
    this.bucketName = bucketName;
    this.keyName = keyName;
  }

  async saveData(data) {
    const params = {
      Bucket: this.bucketName,
      Key: this.keyName,
      Body: data,
      ContentType: 'application/json'
    };
    await this.s3.putObject(params).promise();

  }

  async getData() {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: this.keyName,
      };
      const data = await this.s3.getObject(params).promise();
      return JSON.parse(data.Body.toString());
    } catch (e) {
      console.log('getData error:', e);
      return null;
    }
  }
}

module.exports = S3AutoSave;
