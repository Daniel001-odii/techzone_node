// //////////////////////
require('dotenv').config();
const express = require("express"),
      app = express(),
      userRoutes = require("./routes/userRoutes");

const mongoose = require('mongoose');
const jobRoutes = require('./routes/jobRoutes');
const cors = require("cors");

const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server);
const multer = require('multer');



// Use the cors middleware with options to specify the allowed origin [----DO NOT REMOVE FRPM HERE----]
app.use(cors());








// Connect to the db
mongoose.connect(process.env.MONGODB_URI, function (err, db) {
      console.log("database connected successfully");
     if(err) throw err;
});



// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({
  extended: true
}));



// using users routes...
app.use('/api', userRoutes);
// app.use('/api', jobRoutes);
app.use('/api', jobRoutes);

app.use('/userUploads', express.static('userUploads'));





const fs = require('fs');

// Set up AWS credentials
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { Readable } = require('stream');
const upload = multer({ dest: 'uploads/' });

// Set up AWS credentials
const s3Client = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: 'AKIASAQOSQHZO2X2NYWV',
    secretAccessKey: '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',
  },
});

// Define a route to handle file uploads
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const fileStream = fs.createReadStream(req.file.path);

    const uploadParams = {
      Bucket: 'fortechzone', // Replace with your bucket name
      Body: fileStream,
      Key: req.file.filename,
    };

    const upload = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    const result = await upload.done();

    console.log('File uploaded successfully:', result.Location);

    // Close the file stream
    fileStream.destroy();

    // Clean up the temporary file created by multer
    fs.unlinkSync(req.file.path);

    res.status(200).send('File uploaded');
  } catch (err) {
    console.error('Error uploading file:', err.message);
    res.status(500).send('Failed to upload file');
  }
});







//setup server to listen on port declared on env
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is live on port ${process.env.PORT}`);
})


