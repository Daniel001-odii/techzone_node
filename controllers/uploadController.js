// controllers/uploadController.js

const { MongoClient } = require("mongodb");

const saveFileToMongoDB = async (files) => {
    // MongoDB connection URI
    const mongoURI = "YOUR_MONGODB_URI";

    // Connect to MongoDB
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    // Save file information to MongoDB
    const db = client.db("your-database-name");
    const collection = db.collection("files");

    await Promise.all(
        files.map(async (file) => {
            const fileData = {
                filename: file.originalname,
                location: file.location, // S3 URL
                uploadedAt: new Date(),
            };

            await collection.insertOne(fileData);
        })
    );

    // Close MongoDB connection
    await client.close();
};

module.exports = { saveFileToMongoDB };
