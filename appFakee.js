const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// Function to submit job applications
app.post('/', async (req, res) => {
  try {
    // Access form data
    const { cover_letter, counter_offer, reason_for_co } = req.body;

    // Access files if they exist
    const attachments = req.files ? Object.values(req.files) : [];

    // Perform any necessary validations or processing here

    // Move files to a public folder (you might want to improve this for security)
    const publicFolder = 'public/applications/attachments/';
    if (!fs.existsSync(publicFolder)) {
      fs.mkdirSync(publicFolder, { recursive: true });
    }
    console.log('publicFolder:', publicFolder);

    if (attachments.length > 0) {
      attachments.forEach((file) => {
        const destinationPath = path.join(publicFolder, file.name);
        file.mv(destinationPath, (err) => {
          if (err) throw err;
        });
      });
    }

    // Return necessary information
    res.status(200).json({
      message: 'Job application submitted successfully',
      cover_letter,
      counter_offer,
      reason_for_co,
      attachments: attachments.map((file) => path.join(publicFolder, file.name)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
