const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const otpModel = new Schema(
    {
        otp: { type: String, required: true },
        email: { type: String, required: true },
        expiredAt: { type: Date, default: new Date(Date.now() + 5 * 60 * 1000) },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('otp', otpModel);
