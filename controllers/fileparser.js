
const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client, S3 } = require("@aws-sdk/client-s3");
const Transform = require('stream').Transform;
const formidable = require('formidable');


const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;

const parsefile = async (req) => {
    return new Promise((resolve, reject) => {
        let options = {
            maxFileSize: 100 * 1024 * 1024, //100 megabytes converted to bytes,
            allowEmptyFiles: false
        }

        const form = formidable(options);
        // method accepts the request and a callback.
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

            file.open = async function () {
                this._writeStream = new Transform({
                    transform(chunk, encoding, callback) {
                        callback(null, chunk)
                    }
                });

                this._writeStream.on('error', e => {
                    form.emit('error', e)
                });

                // Upload each file to S3
                new Upload({
                    client: new S3Client({
                        credentials: {
                            accessKeyId,
                            secretAccessKey
                        },
                        region
                    }),
                    params: {
                        ACL: 'public-read',
                        Bucket,
                        Key: `job-application-attachments/${Date.now().toString()}-${file.originalFilename}`,
                        Body: this._writeStream
                    },
                    tags: [], // optional tags
                    queueSize: 4, // optional concurrency configuration
                    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
                    leavePartsOnError: false, // optional manually handle dropped parts
                })
                .done()
                .then(data => {
                    // Emit 'data' event for each file uploaded
                    form.emit('data', { name: "complete", index: filesUploaded, value: data });
                })
                .catch((err) => {
                    form.emit('error', err);
                });
            };

            file.end = function (cb) {
                this._writeStream.on('finish', () => {
                    this.emit('end');
                    cb();
                });
                this._writeStream.end();
            };
        });

        // Array to store upload data for each file
        const uploadData = [];

        form.on('data', data => {
            if (data.name === "complete") {
                // Push upload data to array
                uploadData.push(data.value.Location);

                // If all files have been uploaded, resolve with the array of upload data
                if (uploadData.length === filesUploaded) {
                    resolve(uploadData);
                }
            }
        });
    });
};


module.exports = parsefile;
