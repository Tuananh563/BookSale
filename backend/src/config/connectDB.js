const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Kết nối thành công MongoDB');
    } catch (error) {
        console.error('Kết nối thất bại đến mongodb!', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
