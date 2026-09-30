const usersRouter = require('./users.router');
const categoryRoutes = require('./category.router');
const productRoutes = require('./product.router');
const cartRoutes = require('./cart.router');
const couponRoutes = require('./coupon.router');
const paymentRoutes = require('./payment.router');

function router(app) {
    app.use('/api/user', usersRouter);
    app.use('/api/category', categoryRoutes);
    app.use('/api/product', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/coupon', couponRoutes);
    app.use('/api/payment', paymentRoutes);
}

module.exports = router;
