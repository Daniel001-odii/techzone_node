var mongoose = require('mongoose'), Schema = mongoose.Schema;

const earlyUser = new Schema({
    email: {
        required: true,
        type: String,
    },
    provider: String,

}, {timestamps: true});


module.exports = mongoose.model('earlyUser', earlyUser);