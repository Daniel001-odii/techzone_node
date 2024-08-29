// utils/deleteFileFromS3.js
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/awsConfig');

const deleteFile = async (key) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET, // Your S3 bucket name
      Key: key, // File key to delete
    };

    const command = new DeleteObjectCommand(params);
    const response = await s3.send(command);

    return response; // You can return the response if needed
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

module.exports = deleteFile;
