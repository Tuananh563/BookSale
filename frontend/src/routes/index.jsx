import App from '../App';
import CartUser from '../pages/CartUser';
import Checkout from '../pages/Checkout';
import DetailProduct from '../pages/DetailProduct';
import LoginUser from '../pages/LoginUser';
import ForgotPassword from '../pages/ForgotPassword';
import RegisterUser from '../pages/RegisterUser';
import PaymentSuccessOrder from '../pages/PaymentSuccessOrder';
import MyOrders from '../pages/MyOrders';

const routes = [
    {
        path: '/',
        component: <App />,
    },
    {
        path: 'product/:id',
        component: <DetailProduct />,
    },
    {
        path: '/login',
        component: <LoginUser />,
    },
    {
        path: '/forgot-password',
        component: <ForgotPassword />,
    },
    {
        path: '/register',
        component: <RegisterUser />,
    },
    {
        path: '/cart',
        component: <CartUser />,
    },
    {
        path: '/checkout',
        component: <Checkout />,
    },
    {
        path: '/payment-success/:orderId',
        component: <PaymentSuccessOrder />,
    },
    {
        path: '/my-orders',
        component: <MyOrders />,
    },
];

export default routes;
