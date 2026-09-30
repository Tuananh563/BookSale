const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const user_model = new Schema(
    {
        fullname: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
        isAdmin: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('User', user_model, 'users');
