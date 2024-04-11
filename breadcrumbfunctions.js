// Function to submit job applications [SAVES ATTACHMENTS IN SERVER]
exports.submitApplicationMai = async (req, res) => {
  const existingAplication = await Application.findOne({ user:req.userId, job: req.job });
  if(existingAplication){
    res.status(200).json({ message: "You already submitted an application"})
  } else {
    try {
      // Access form data
      const { cover_letter, counter_offer, reason_for_co } = req.body;
  
      // Access files if they exist
      const attachments = req.files ? Object.values(req.files) : [];

      // increase number of applications...
      // const job = await Job.findOne({ _id:req.params.job_id });
      // job.no_of_applications += 1;
      // await job.save();
  
      // Perform any necessary validations or processing here
  
      // Move files to a public folder (you might want to improve this for security)
      const publicFolder = 'public/applications/attachments';
      if (!fs.existsSync(publicFolder)) {
        fs.mkdirSync(publicFolder, { recursive: true });
      }
      console.log('publicFolder:', publicFolder);
  
      if (attachments.length > 0) {
        // Flatten the nested array if it exists
        const flatAttachments = attachments.flat();
      
        flatAttachments.forEach((file) => {
          const destinationPath = path.join(__dirname, publicFolder, file.name);
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
        // attachments: attachments.length > 0 ? attachments.flat().map((file) => path.join(publicFolder, file.name)) : [],
      });



      const newApplication = new Application({
        job: req.params.job_id,
        user: req.userId,
        cover_letter,
        // attachment: attachments.length > 0 ? attachments.flat().map((file) => ({
        //   name: file.name,
        //   url: path.join(__dirname, publicFolder, file.name),
        // })): [],
        counter_offer,
        reason_for_co
      })

      await newApplication.save();

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  };
  


  
// Function to submit job applications [SAVES ATTACHMENTS TO S3 BUCKET]
exports.submitApplication = async (req, res) => {
  const existingAplication = await Application.findOne({ user:req.userId });
  if(existingAplication){
    res.status(200).json({ message: "You already submitted an application"})
  } else {
    try {
      // Access form data
      const { cover_letter, counter_offer, reason_for_co } = req.body;

      // Return necessary information
      res.status(200).json({
        message: 'Job application submitted successfully',
        cover_letter,
        counter_offer,
        reason_for_co,
        // attachments: attachments.map((file) => file.location), // Use file.location for S3 URLs
      });
  
      const newApplication = new Application({
        job: req.params.job_id,
        user: req.userId,
        cover_letter,
        // attachments will be added..
        counter_offer,
        reason_for_co,
      });
  
      await newApplication.save();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  };



exports.uploadFilesToS3 = async (req, res) => {
  await fileparser(req)
  .then(data => {
    res.status(200).json({
      message: "Success",
      data
    });
    
  })
  .catch(error => {
    res.status(400).json({
      message: "An error occurred.",
      error
    })
  })
};


