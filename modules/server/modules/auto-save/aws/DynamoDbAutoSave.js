const AWS = require('aws-sdk');

class DynamoDBAutoSave {
  constructor(tableName, key, options = {}) {
    AWS.config.update({
      accessKeyId: options.accessKeyId || process.env.AWS_ACCESS_KEY_ID || undefined,
      secretAccessKey: options.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || undefined,
      region: options.region || process.env.AWS_REGION || 'us-east-1'
    });
    this.dynamoDb = new AWS.DynamoDB.DocumentClient();
    this.tableName = tableName;
    this.key = key; // Expecting an object with partitionKey and optional sortKey
  }

  async saveData(data) {
    try {
      // Clear the existing data
      await this.clearData();

      // Flatten and chunk the data
      const items = this.flattenAndChunkData(data);

      // Save each item to DynamoDB
      for (const item of items) {
        await this.dynamoDb.put(item).promise();
      }

      console.log('Data successfully saved to DynamoDB.');
    } catch (e) {
      console.log('autosave error:', e);
    }
  }

  async getData() {
    try {
      // Scan for all items with the same partition key
      const scanParams = {
        TableName: this.tableName,
        FilterExpression: 'partitionKey = :partitionKey',
        ExpressionAttributeValues: {
          ':partitionKey': this.key.partitionKey
        }
      };
      const data = await this.dynamoDb.scan(scanParams).promise();

      // Combine the data into a single object
      const combinedData = data.Items.reduce((acc, item) => {
        return { ...acc, ...item.data };
      }, {});

      // Rebuild the original structure from combinedData
      const rebuiltData = this.rebuildData(combinedData);

      return rebuiltData;
    } catch (e) {
      console.log('getData error:', e);
      return null;
    }
  }

  async clearData() {
    try {
      // Scan for all items with the same partition key
      const scanParams = {
        TableName: this.tableName,
        FilterExpression: 'partitionKey = :partitionKey',
        ExpressionAttributeValues: {
          ':partitionKey': this.key.partitionKey
        }
      };
      const data = await this.dynamoDb.scan(scanParams).promise();

      // Delete each item
      for (const item of data.Items) {
        await this.dynamoDb.delete({
          TableName: this.tableName,
          Key: { ...this.key, id: item.id } // Assume `id` is used to identify individual items
        }).promise();
      }
    } catch (e) {
      console.log('clearData error:', e);
    }
  }

  flattenAndChunkData(data, prefix = '') {
    const items = [];
    const traverse = (obj, currentKey) => {
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const newKey = currentKey ? `${currentKey}.${key}` : key;
          traverse(value, newKey);
        }
      } else {
        // Create a document with currentKey and obj
        const doc = { [currentKey]: obj };
        const serializedDoc = JSON.stringify(doc);

        // Ensure the document size does not exceed DynamoDB item limit (300 KB)
        if (Buffer.byteLength(serializedDoc) > 300000) {
          throw new Error('Item size exceeds DynamoDB limit');
        }

        // Add the document to the items array
        items.push({
          TableName: this.tableName,
          Item: {
            ...this.key,
            id: currentKey, // Unique identifier for the sub-item
            data: doc
          }
        });
      }
    };
    traverse(data, prefix);
    return items;
  }

  rebuildData(data) {
    // Rebuilds the original nested structure from the flat combined data
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      const keys = key.split('.');
      keys.reduce((acc, part, index) => {
        if (index === keys.length - 1) {
          acc[part] = value;
        } else {
          if (!acc[part]) {
            acc[part] = {};
          }
          return acc[part];
        }
      }, result);
    }
    return result;
  }
}

module.exports = DynamoDBAutoSave;
