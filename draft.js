// Route to handle user profile image uploads
router.post('/upload-profile-image', verifyToken, upload.single('profileImage'), async (req, res) => {
  const fileStream = Readable.from(req.file.path);

  const params = {
    Bucket: 'fortechzone',
    Key: req.file.originalname,
    Body: fileStream,
  };

  // try {
  //   const imageUrl = req.file.path; // Get the path to the uploaded image

  //   const userId = req.userId;
  //   console.log("this is the ID of the user uploading: ", userId);
  //   console.log("and the uploaded image path is: ", req.file.path);

  //   // Find the user by ID and update the profilePicture property with the image URL
  //   const user = await User.findOne({
  //     _id: userId,
  //   });


  //   if (!user) {
  //     return res.status(404).json({ message: 'User not found' });
  //   }else{console.log("user found: ", user.firstname + "-" + user.lastname)}

  //   user.profile.profileImage = `${process.env.LOCAL_URL}/${imageUrl}`;
  //   // user.profile.profileImage = `/${imageUrl}`;
  //   await user.save();

  //   res.status(200).json({ message: 'Profile image uploaded successfully', imageUrl });
  // } catch (error) {
  //   console.error('Error uploading profile image', error);
  //   res.status(500).json({ message: 'Error uploading profile image', error: error.message });
  // }

  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log('File uploaded successfully');
    res.status(200).send('File uploaded');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to upload file');
  }

});













// ------------------------------------




// this line and a few below controls file uploads to aws s3 bucket..............
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
// Set up AWS credentials
const s3Client = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: 'AKIASAQOSQHZO2X2NYWV',
    secretAccessKey: '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',
  },
});


// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

const { Readable } = require('stream');

// Define a route to handle file uploads
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (req.file) {
    console.log("file found: ", req.file);
    // The rest of your code for handling the upload
    const fileStream = new Readable();
    fileStream.push(req.file.buffer);
    fileStream.push(null); // Indicates the end of the stream

        const params = {
          Bucket: 'fortechzone',
          Key: req.file.originalname,
          Body: fileStream,
          ContentLength: req.file.size,
        };
        try {
          await s3Client.send(new PutObjectCommand(params));
          console.log('File uploaded successfully');
          res.status(200).send('File uploaded');
        } catch (err) {
          console.error(err);
          res.status(500).send('Failed to upload file');
        }
  } else {
        res.status(400).send('No file uploaded');
  }
});
