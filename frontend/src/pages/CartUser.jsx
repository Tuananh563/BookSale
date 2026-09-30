import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Minus,
    PackageCheck,
    Plus,
    ShieldCheck,
    ShoppingBag,
    Tag,
    Trash2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { requestApplyCoupon, requestGetCart } from '../config/CartRequest';
import { useStore } from '../hooks/useStore';

function formatPrice(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

function CartUser() {
    const navigate = useNavigate();
    const { dataUser, cartItems, updateCartQuantity, removeFromCart } = useStore();
    const [coupons, setCoupons] = useState([]);
    const [selectedCouponId, setSelectedCouponId] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const total = cartItems.reduce((sum, item) => {
        const price = Number(item.priceProduct) * (1 - (Number(item.discountProduct) || 0) / 100);
        return sum + price * item.quantity;
    }, 0);
    const discountAmount = appliedCoupon ? (total * Number(appliedCoupon.discount)) / 100 : 0;
    const finalTotal = Math.max(total - discountAmount, 0);

    useEffect(() => {
        if (!dataUser?._id || cartItems.length === 0) {
            setCoupons([]);
            setAppliedCoupon(null);
            setSelectedCouponId('');
            return;
        }

        requestGetCart()
            .then((response) => setCoupons(response?.metadata?.coupons || []))
            .catch(() => setCoupons([]));
    }, [dataUser?._id, cartItems.length]);

    const handleApplyCoupon = async (event) => {
        const couponId = event.target.value;
        const coupon = coupons.find((item) => item._id === couponId);
        setSelectedCouponId(couponId);
        setCouponError('');
        setAppliedCoupon(null);
        if (!couponId) return;

        if (coupon && total < Number(coupon.minPrice)) {
            setSelectedCouponId('');
            setCouponError(`Đơn hàng chưa đủ điều kiện. Mã này yêu cầu đơn tối thiểu ${formatPrice(coupon.minPrice)}`);
            return;
        }

        try {
            setIsApplyingCoupon(true);
            await requestApplyCoupon(couponId);
            setAppliedCoupon(coupon || null);
        } catch (error) {
            setSelectedCouponId('');
            setAppliedCoupon(null);
            setCouponError(error.response?.data?.message || 'Không thể áp dụng mã giảm giá');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    return (
        <div>
            <Header />
            <main className="cart-page">
                {cartItems.length === 0 ? (
                    <section className="cart-empty">
                        <ShoppingBag size={42} />
                        <h2>Giỏ hàng đang trống</h2>
                        <p>Hãy chọn thêm sản phẩm yêu thích để bắt đầu mua sắm.</p>
                        <Link className="cart-continue" to="/">
                            Khám phá sản phẩm
                        </Link>
                    </section>
                ) : (
                    <div className="cart-layout">
                        <section className="cart-list" aria-label="Sản phẩm trong giỏ hàng">
                            <div className="cart-list__header">
                                <span>Sản phẩm đã chọn</span>
                                <span>Thành tiền</span>
                            </div>
                            {cartItems.map((item) => {
                                const price =
                                    Number(item.priceProduct) * (1 - (Number(item.discountProduct) || 0) / 100);
                                return (
                                    <article className="cart-item" key={item._id}>
                                        <div className="cart-item__image">
                                            {item.imagesProduct?.[0] ? (
                                                <img src={item.imagesProduct[0]} alt={item.nameProduct} />
                                            ) : (
                                                <ShoppingBag size={24} />
                                            )}
                                        </div>
                                        <div className="cart-item__info">
                                            <h2>{item.nameProduct}</h2>
                                            <div className="cart-item__details">
                                                <span>
                                                    Danh mục:{' '}
                                                    <strong>
                                                        {item.categoryProduct?.nameCategory || 'Chưa cập nhật'}
                                                    </strong>
                                                </span>
                                                <span>
                                                    Nhà cung cấp:{' '}
                                                    <strong>{item.metadata?.publisher || 'Chưa cập nhật'}</strong>
                                                </span>
                                            </div>
                                            <div className="cart-item__price">
                                                <strong>{formatPrice(price)}</strong>
                                                {Number(item.discountProduct) > 0 && (
                                                    <del>{formatPrice(item.priceProduct)}</del>
                                                )}
                                            </div>
                                            <div className="cart-item__controls">
                                                <div
                                                    className="quantity-control"
                                                    aria-label={`Số lượng ${item.nameProduct}`}
                                                >
                                                    <button
                                                        type="button"
                                                        aria-label="Giảm số lượng"
                                                        disabled={item.quantity <= 1}
                                                        onClick={() => updateCartQuantity(item._id, item.quantity - 1)}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span>{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        aria-label="Tăng số lượng"
                                                        disabled={item.quantity >= Number(item.stockProduct)}
                                                        onClick={() => updateCartQuantity(item._id, item.quantity + 1)}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <button
                                                    className="cart-item__remove"
                                                    type="button"
                                                    onClick={() => removeFromCart(item._id)}
                                                >
                                                    <Trash2 size={16} /> Xóa
                                                </button>
                                            </div>
                                        </div>
                                        <strong className="cart-item__total">
                                            {formatPrice(price * item.quantity)}
                                        </strong>
                                    </article>
                                );
                            })}
                        </section>
                        <aside className="cart-summary">
                            <h2>Tóm tắt đơn hàng</h2>
                            <div>
                                <span size={16}>Tạm tính</span>
                                <strong>{formatPrice(total)}</strong>
                            </div>
                            <div className="cart-coupon">
                                <div className="cart-coupon__heading">
                                    <span>
                                        <Tag size={16} /> Mã Giảm Giá
                                    </span>
                                </div>
                                {coupons.length > 0 ? (
                                    <div className="coupon-grid" aria-label="Danh sách mã giảm giá">
                                        {coupons.map((coupon) => {
                                            const isSelected = selectedCouponId === coupon._id;
                                            return (
                                                <button
                                                    className={`coupon-card${isSelected ? ' coupon-card--selected' : ''}`}
                                                    key={coupon._id}
                                                    type="button"
                                                    disabled={isApplyingCoupon}
                                                    onClick={() => handleApplyCoupon({ target: { value: coupon._id } })}
                                                >
                                                    <span className="coupon-card__content">
                                                        <span className="coupon-card__main">
                                                            <strong>{coupon.nameCoupon}</strong>
                                                            <b>-{coupon.discount}%</b>
                                                        </span>
                                                        <small>Đơn tối thiểu {formatPrice(coupon.minPrice)}</small>
                                                        {isSelected && (
                                                            <small className="coupon-card__applied">✓ Đã áp dụng</small>
                                                        )}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="coupon-empty">Chưa có mã giảm giá phù hợp với đơn hàng này.</div>
                                )}
                            </div>
                            {couponError && (
                                <p className="cart-coupon__error" role="alert">
                                    <AlertCircle size={16} /> {couponError}
                                </p>
                            )}
                            {appliedCoupon && (
                                <div className="cart-summary__discount">
                                    <span>Giảm giá ({appliedCoupon.discount}%)</span>
                                    <strong>-{formatPrice(discountAmount)}</strong>
                                </div>
                            )}
                            <hr />
                            <div className="cart-summary__total">
                                <span>Tổng cộng</span>
                                <strong>{formatPrice(finalTotal)}</strong>
                            </div>
                            <button className="cart-checkout" type="button" onClick={() => navigate('/checkout')}>
                                Tiến hành thanh toán <ArrowRight size={18} />
                            </button>
                            <Link className="cart-summary__continue" to="/">
                                <ArrowLeft size={17} /> Tiếp tục mua sắm
                            </Link>
                            <div className="cart-summary__secure">
                                <ShieldCheck size={16} /> Thanh toán an toàn và bảo mật
                            </div>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}

export default CartUser;
