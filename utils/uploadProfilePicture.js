// utils/uploadProfilePicture.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/awsConfig');

const uploadProfilePicture = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET, // Your S3 bucket name
    acl: 'public-read',
    key: function (req, file, cb) {
      const fileName = `profile-images/${Date.now()}_${file.originalname}`;
      cb(null, fileName);
    },
  }),
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png/;
    const mimeType = fileTypes.test(file.mimetype);
    if (mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed!'), false);
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
});

module.exports = uploadProfilePicture;
