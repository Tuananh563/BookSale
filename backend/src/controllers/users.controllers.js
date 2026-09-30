const { ConflictRequestError, NotFoundError, AuthFailureError, BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

const user_model = require('../models/user.model');
const otpModel = require('../models/otp.model');
const jwt = require('jsonwebtoken');

const { createAccessTocken, createRefeshToken, verifyToken } = require('../auth/checkAuth');
const SendMailForgotPassword = require('../utils/mailForgotPassword');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');

function setCookie(res, accessTocken, refeshToken) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessTocken, {
        httpOnly: true,
        secure: isProduction,
        maxAge: 1 * 24 * 60 * 60 * 1000,
        sameSite: 'Strict',
    });
    res.cookie('refeshToken', refeshToken, {
        httpOnly: true,
        secure: isProduction,
        maxAge: 1 * 24 * 60 * 60 * 1000,
        sameSite: 'Strict',
    });
    res.cookie('logged', 1, {
        httpOnly: false,
        secure: isProduction,
        maxAge: 1 * 24 * 60 * 60 * 1000,
        sameSite: 'Strict',
    });
}

class UsersController {
    async register(req, res) {
        const { fullname, email, password } = req.body;
        const findUser = await user_model.findOne({ email });
        if (findUser) {
            throw new ConflictRequestError('Email da ton tai');
        }

        const saltRounds = 10;
        const hashPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await user_model.create({
            fullname,
            email,
            password: hashPassword,
        });

        const accessTocken = createAccessTocken({ id: newUser._id });
        const refeshToken = createRefeshToken({ id: newUser._id });

        setCookie(res, accessTocken, refeshToken);
        return new Created({
            message: 'Dang ky thanh cong',
            metadata: newUser,
        }).send(res);
    }

    async login(req, res) {
        const { email, password } = req.body;
        const findUser = await user_model.findOne({ email });

        if (!findUser) {
            throw new NotFoundError('tai khoan hoac mat khua khong chinh xac');
        }

        const isMathPassword = await bcrypt.compare(password, findUser.password);

        if (!isMathPassword) {
            throw new AuthFailureError('Tai khoan hoac mat khau khong chinh xac');
        }

        const accessTocken = createAccessTocken({ id: findUser._id });
        const refeshToken = createRefeshToken({ id: findUser._id });
        setCookie(res, accessTocken, refeshToken);
        return new OK({
            message: 'Dang nhap thanh cong',
            metadata: { accessTocken, refeshToken },
        }).send(res);
    }

    async authUser(req, res) {
        const userId = req.user;
        const findUser = await user_model.findById(userId);
        if (!findUser) {
            throw new NotFoundError('Nguoi dung khong ton tai');
        }
        return new OK({
            message: 'Xac thuc thanh cong',
            metadata: findUser,
        }).send(res);
    }

    async logout(req, res) {
        const userId = req.user;
        const findUser = await user_model.findById(userId);
        if (!findUser) {
            throw new NotFoundError('Nguoi dung khong ton tai');
        }
        res.clearCookie('accessToken');
        res.clearCookie('refeshToken');
        res.clearCookie('logged');
        return new OK({
            message: 'Dang xuat thanh cong',
            metadata: findUser,
        }).send(res);
    }

    async forgotPassword(req, res) {
        const { email } = req.body;
        const findUser = await user_model.findOne({ email });
        if (!findUser) {
            throw new NotFoundError('Email không tồn tại');
        }

        const otp = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const tokenForgotPassword = jwt.sign({ email }, process.env.JWT_SECRET, {
            expiresIn: '5m',
        });

        res.cookie('tokenForgotPassword', tokenForgotPassword, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 5 * 60 * 1000,
            sameSite: 'strict',
        });

        await otpModel.create({
            otp,
            email,
        });

        await SendMailForgotPassword(email, otp);

        return new OK({
            message: 'Mã OTP đã được gửi đến email của bạn',
            metadata: true,
        }).send(res);
    }
    async verifyForgotPassword(req, res) {
        const { otp, password } = req.body;
        const tokenForgotPassword = req.cookies.tokenForgotPassword;
        if (!tokenForgotPassword || !otp) {
            throw new BadRequestError('Bạn đang thiếu thông tin');
        }
        const decoded = jwt.verify(tokenForgotPassword, process.env.JWT_SECRET);
        if (!decoded) {
            throw new BadRequestError('Vui lòng gửi lại yêu cầu ');
        }

        const email = decoded.email;

        const findOtp = await otpModel.findOne({ email, otp });
        if (!findOtp) {
            throw new BadRequestError('Mã OTP không hợp lệ');
        }

        const findUser = await user_model.findOne({ email });
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        findUser.password = hashedPassword;

        await findUser.save();

        await otpModel.deleteMany({ email });
        res.clearCookie('tokenForgotPassword');

        return new OK({
            message: 'Khôi phục mật khẩu thành công',
            metadata: true,
        }).send(res);
    }
}

module.exports = new UsersController();
