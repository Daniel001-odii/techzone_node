// utils/uploadDocument.js
const multer = require('multer');
const path = require('path');
const { Upload } = require('@aws-sdk/lib-storage');
const s3 = require('../config/awsConfig');

// Setup multer for local file storage before uploading to S3
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png|svg|gif|pdf|doc|txt|json|docx|ppt|pptx/;
    const mimeType = fileTypes.test(file.mimetype);
    if (mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

// Function to upload a single file to S3
const uploadSingleFile = async (file, s3_location) => {
  const uploadParams = {
    Bucket: process.env.S3_BUCKET,
    Key: `${s3_location}/${file.originalname}`, // Construct the file key
    Body: file.buffer, // Using the file buffer from multer memory storage
    ACL: 'public-read',
  };

  const upload = new Upload({
    client: s3,
    params: uploadParams,
  });

  try {
    const result = await upload.done();
    return result;
  } catch (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

// Middleware for handling multiple file uploads
const uploadMultipleDocuments = async (req, res, next) => {
  upload.array('files', 5)(req, res, async (err) => { // Allows up to 5 files
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const uploadPromises = req.files.map(file => uploadSingleFile(file, 'job-application-attachments'));
      const uploadResults = await Promise.all(uploadPromises);
      req.uploadResults = uploadResults; // Attach the results to the request object
      next();
    } catch (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }
  });
};


// Middleware for handling multiple file uploads
const uploadMultipleMessageDocuments = async (req, res, next) => {
  upload.array('files', 5)(req, res, async (err) => { // Allows up to 5 files
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const uploadPromises = req.files.map(file => uploadSingleFile(file, 'messages'));
      const uploadResults = await Promise.all(uploadPromises);
      req.uploadResults = uploadResults; // Attach the results to the request object
      next();
    } catch (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }
  });
};



module.exports = { uploadMultipleDocuments, uploadMultipleMessageDocuments};
