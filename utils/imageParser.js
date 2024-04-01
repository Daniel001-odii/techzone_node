
const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client, S3 } = require("@aws-sdk/client-s3");
const Transform = require('stream').Transform;
const formidable = require('formidable');


const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;

const parsefile = async (req, formFieldName = 'image') => {
    return new Promise((resolve, reject) => {
        let options = {
            maxFileSize: 100 * 1024 * 1024, // 100 megabytes converted to bytes,
            allowEmptyFiles: false
        }

        const form = formidable(options);

        form.parse(req, (err, fields, files) => {
            // console.log(fields, "====", files)
        });

        form.on('error', error => {
            reject(error.message)
        });

        // Counter to track the number of files uploaded
        let filesUploaded = 0;

        form.on('fileBegin', (formName, file) => {
            // Increment the counter for each file
            filesUploaded++;

            if (formName === formFieldName) { // Check if the form field name matches the desired name
                file.open = async function () {
                    // File handling logic remains the same
                };

                file.end = function (cb) {
                    // File handling logic remains the same
                };
            }
        });

        // Array to store upload data for each file
        const uploadData = [];

        form.on('data', data => {
            // Data handling logic remains the same
        });
    });
};

module.exports = parsefile;
