const cartModel = require('../models/cart.model');
const paymentModel = require('../models/payment.model');
const couponModel = require('../models/coupon.model');

const { NotFoundError, BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

const crypto = require('crypto');
const https = require('https');

class PaymentController {
    async createPayment(req, res) {
        const { typePayment } = req.body;
        const id = req.user;

        const findCartUser = await cartModel.findOne({ userId: id });

        if (!findCartUser) {
            throw new NotFoundError('Giỏ hàng không tồn tại');
        }

        if (findCartUser.products.length === 0) {
            throw new BadRequestError('Giỏ hàng không có sản phẩm');
        }

        if (typePayment === 'cod') {
            const newPayment = await paymentModel.create({
                userId: id,
                products: findCartUser.products,
                totalPrice: findCartUser.totalPrice,
                fullName: findCartUser.fullName,
                phoneNumber: findCartUser.phoneNumber,
                address: findCartUser.address,
                email: findCartUser.email,
                finalPrice: findCartUser.finalPrice,
                couponId: findCartUser.couponId,
                paymentMethod: 'cod',
                status: 'pending',
            });

            await findCartUser.deleteOne();
            await cartModel.create({
                userId: id,
                products: [],
            });

            await couponModel.findByIdAndUpdate(findCartUser.couponId, { $inc: { quantity: -1 } });

            return new Created({
                message: 'Tạo đơn hàng thành công',
                metadata: newPayment,
            }).send(res);
        } else if (typePayment === 'momo') {
            const accessKey = 'F8BBA842ECF85';
            const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            const partnerCode = 'MOMO';
            const orderId = partnerCode + new Date().getTime();
            const requestId = orderId;
            const orderInfo = `Thanh toan don hang ${findCartUser.userId}`;
            const redirectUrl = 'http://localhost:3000/api/payment/momo-callback';
            const ipnUrl = 'http://localhost:3000/api/payment/momo-callback';
            const requestType = 'payWithMethod';
            const amount = Number(findCartUser.couponId ? findCartUser.finalPrice : findCartUser.totalPrice);
            const extraData = '';

            const rawSignature =
                'accessKey=' +
                accessKey +
                '&amount=' +
                amount +
                '&extraData=' +
                extraData +
                '&ipnUrl=' +
                ipnUrl +
                '&orderId=' +
                orderId +
                '&orderInfo=' +
                orderInfo +
                '&partnerCode=' +
                partnerCode +
                '&redirectUrl=' +
                redirectUrl +
                '&requestId=' +
                requestId +
                '&requestType=' +
                requestType;

            const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            const requestBody = JSON.stringify({
                partnerCode,
                partnerName: 'Test',
                storeId: 'MomoTestStore',
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                lang: 'vi',
                requestType,
                autoCapture: true,
                extraData,
                orderGroupId: '',
                signature,
            });

            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
                },
            };

            const req1 = https.request(options, (res1) => {
                let data = '';
                res1.on('data', (chunk) => {
                    data += chunk;
                });
                res1.on('end', () => {
                    try {
                        return new Created({
                            message: 'Tạo đơn hàng thành công',
                            metadata: JSON.parse(data),
                        }).send(res);
                    } catch (err) {
                        console.log(err);
                    }
                });
            });

            req1.on('error', (e) => console.log(e));
            req1.write(requestBody);
            req1.end();
        }
    }

    async momoCallback(req, res) {
        const { resultCode, orderInfo } = req.query;
        if (resultCode !== '0') {
            throw new BadRequestError('Thanh toán thất bại');
        }

        const userId = orderInfo.split(' ')[4];
        const findCartUser = await cartModel.findOne({ userId });
        if (!findCartUser) {
            throw new NotFoundError('Giỏ hàng không tồn tại');
        }
        const newPayment = await paymentModel.create({
            userId,
            products: findCartUser.products,
            totalPrice: findCartUser.totalPrice,
            fullName: findCartUser.fullName,
            phoneNumber: findCartUser.phoneNumber,
            address: findCartUser.address,
            email: findCartUser.email,
            finalPrice: findCartUser.finalPrice,
            couponId: findCartUser.couponId,
            paymentMethod: 'momo',
            status: 'pending',
        });
        await findCartUser.deleteOne();
        await cartModel.create({
            userId,
            products: [],
        });

        await couponModel.findByIdAndUpdate(findCartUser.couponId, { $inc: { quantity: -1 } });

        return res.redirect(`${process.env.CLIENT_URL}/payment-success/${newPayment._id}?clearCart=1`);
    }
    async getPaymentsAdmin(req, res) {
        const dataPayment = await paymentModel
            .find({})
            .populate('userId', 'fullName email')
            .populate('products.productId', '')
            .populate('couponId');
        return new OK({
            message: 'Lấy danh sách đơn hàng thành công',
            metadata: dataPayment,
        }).send(res);
    }
    async getPaymentsByUser(req, res) {
        const dataPayment = await paymentModel
            .find({ userId: req.user })
            .sort({ createdAt: -1 })
            .populate('products.productId', '')
            .populate('couponId');
        return new OK({
            message: 'Lấy danh sách đơn hàng thành công',
            metadata: dataPayment,
        }).send(res);
    }
    async updatePayment(req, res) {
        const { orderId } = req.params;
        const { status } = req.body;
        if (!orderId || !status) {
            throw new BadRequestError('Bạn đang thiếu thông tin');
        }

        const findPayment = await paymentModel.findById(orderId);
        if (!findPayment) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        findPayment.status = status;
        await findPayment.save();
        return new OK({
            message: 'Cập nhật đơn hàng thành công',
            metadata: findPayment,
        }).send(res);
    }
    async getPaymentById(req, res) {
        const { orderId } = req.params;
        const findPayment = await paymentModel
            .findById(orderId)
            .populate('userId', 'fullName email')
            .populate('products.productId', '')
            .populate('couponId');
        if (!findPayment) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }
        return new OK({
            message: 'Lấy đơn hàng thành công',
            metadata: findPayment,
        }).send(res);
    }
}

module.exports = new PaymentController();
