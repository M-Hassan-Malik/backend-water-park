const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OtpSchema = new Schema({
    otp: {
        type: String,
        required: true,
    },
    validity: {
        type: Date,
        required: true
    }
}, { collection: 'otp' });

const Otp = mongoose.model('Otp', OtpSchema);

module.exports = Otp;