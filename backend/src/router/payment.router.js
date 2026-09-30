const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin, authUser } = require('../middleware/authUser');

const paymentController = require('../controllers/payment.controllers');

router.post('/create', authUser, asyncHandler(paymentController.createPayment));
router.get('/vnpay-callback', asyncHandler(paymentController.vnpayCallback));
router.get('/momo-callback', asyncHandler(paymentController.momoCallback));

router.get('/my-orders', authUser, asyncHandler(paymentController.getPaymentsByUser));
router.get('/order/:orderId', authUser, asyncHandler(paymentController.getPaymentById));

router.get('/admin/list', authAdmin, asyncHandler(paymentController.getPaymentsAdmin));
router.put('/admin/update/:orderId', authAdmin, asyncHandler(paymentController.updatePayment));

module.exports = router;
