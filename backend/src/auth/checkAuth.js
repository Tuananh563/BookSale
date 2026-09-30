const jwt = require('jsonwebtoken');

const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

const createAccessTocken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1d',
        algorithm: 'HS256',
    });
};

const createRefeshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d',
        algorithm: 'HS256',
    });
};

const verifyToken = async (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
    return decode;
};

module.exports = { asyncHandler, createAccessTocken, createRefeshToken, verifyToken };
