const mongoose = require('mongoose');
const Employer = require('./models/employerModel');

// Connect to the db
mongoose.connect("mongodb://127.0.0.1:27017/Techzone_full", function (err, db) {
    console.log("database connected successfully");
   if(err) throw err;
});

// Dummy data for seeding Employers
const employersData = [
  {
    email: 'employer1@example.com',
    role: 'employer',
    password: 'password1',
    firstname: 'John',
    lastname: 'Doe',
    jobs: [], // Add ObjectId of jobs if required
    completedJobs: [], // Add ObjectId of completed jobs if required
    realRating: [], // Add real rating objects if required
    ratedValue: 0, // Add rated value if required
    profile: {
      tagline: 'Senior Developer',
      description: 'Experienced in building web applications.',
      company_name: 'Techzone Employer',
      website: 'https://www.techzoneemployer.com',
      industry_type: 'Technology',
      phone: '123-456-7890',
      location: 'City, Country',
      city: { city_name: 'City', zip: '12345' },
      socialAccount: 'https://linkedin.com/yourprofile',
      // profileImage: 'https://yourprofileimage.com', // Add profile image if required
    },
    isVerified: true, // Change to false if not verified
    notifications: [], // Add ObjectId of notifications if required
    resetToken: '', // Add reset token if required
    resetTokenExpiration: null, // Add reset token expiration date if required
    verificationToken: '', // Add verification token if required
  },
  // Add more employer data as needed
];

// Function to insert employer data into the Employers collection
async function seedEmployers() {
    console.log("Seeding employer db started...")
  try {
    // Insert Employers
    await Employer.insertMany(employersData);
    console.log('Employer data seeded successfully.');
    mongoose.connection.close(); // Close the connection after seeding
  } catch (err) {
    console.error('Error seeding Employers:', err);
    mongoose.connection.close(); // Close the connection in case of error
  }
}

// Run the seeding function
seedEmployers();