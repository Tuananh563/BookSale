import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, CreditCard, Mail, MapPin, Package, Phone, UserRound } from 'lucide-react';
import Header from '../components/Header';
import { requestPaymentById } from '../config/paymentRequest';
import { useStore } from '../hooks/useStore';

function formatPrice(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

function PaymentSuccessOrder() {
    const { orderId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useStore();
    const [payment, setPayment] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        requestPaymentById(orderId)
            .then((response) => {
                if (active) setPayment(response?.metadata || null);
            })
            .catch(() => {
                if (active) setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
            });
        return () => {
            active = false;
        };
    }, [orderId]);

    useEffect(() => {
        if (payment && new URLSearchParams(location.search).get('clearCart') === '1') {
            clearCart();
            navigate(location.pathname, { replace: true });
        }
    }, [clearCart, location.pathname, location.search, navigate, payment]);

    const content = !payment ? (
        <section className="rounded-lg border border-[#e5e7eb] bg-white px-6 py-16 text-center shadow-sm">
            <p className={error ? 'text-red-600' : 'text-[#68736d]'}>{error || 'Đang tải thông tin đơn hàng...'}</p>
            {error && (
                <Link className="mt-4 inline-block font-semibold text-blue-700" to="/">
                    Về trang chủ
                </Link>
            )}
        </section>
    ) : (
        <>
            <section className="mb-6 rounded-lg border border-[#e5e7eb] bg-white px-5 py-8 text-center shadow-sm md:px-8">
                <CheckCircle2 className="mx-auto mb-3 text-green-500" size={58} strokeWidth={2.2} />
                <h1 className="text-2xl font-bold text-[#28313b] md:text-3xl">Đặt Hàng Thành Công!</h1>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#687078]">
                    Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
                </p>
                <p className="mt-4 text-sm font-semibold text-[#454c54]">
                    Mã đơn hàng: <span className="break-all font-mono text-blue-700">{payment._id}</span>
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        to="/"
                        className="flex min-h-11 items-center justify-center rounded-md border border-[#d9dde2] bg-white px-5 text-sm font-semibold text-[#303943] transition hover:bg-[#f5f6f8]"
                    >
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </section>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(340px,0.9fr)]">
                <div className="space-y-5">
                    <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm md:p-6">
                        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#29323d]">
                            <UserRound size={20} /> Thông Tin Người Nhận
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Info icon={UserRound} label="Họ và tên" value={payment.fullName} />
                            <Info icon={Phone} label="Số điện thoại" value={payment.phoneNumber} />
                            <Info icon={Mail} label="Email" value={payment.email} />
                            <Info icon={MapPin} label="Địa chỉ giao hàng" value={payment.address} />
                        </div>
                    </section>

                    <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm md:p-6">
                        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#29323d]">
                            <Package size={20} /> Sản Phẩm Đã Đặt
                        </h2>
                        <div className="space-y-4">
                            {(payment.products || []).map((item) => {
                                const product = item.productId || {};
                                const price = Number(product.priceProduct) || 0;
                                const discount = Number(product.discountProduct) || 0;
                                const discountedPrice = price * (1 - discount / 100);
                                const quantity = Number(item.quantity) || 0;
                                return (
                                    <article
                                        className="flex gap-4 border-b border-[#edf0f2] pb-4 last:border-0 last:pb-0"
                                        key={item._id || product._id}
                                    >
                                        <div className="h-24 w-[76px] shrink-0 overflow-hidden rounded bg-[#f3f5f2]">
                                            {product.imagesProduct?.[0] && (
                                                <img
                                                    className="h-full w-full object-cover"
                                                    src={product.imagesProduct[0]}
                                                    alt={product.nameProduct || 'Sản phẩm'}
                                                />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-[#303943]">
                                                {product.nameProduct || 'Sản phẩm'}
                                            </h3>
                                            {product.categoryProduct?.nameCategory && (
                                                <p className="mt-1 text-sm text-[#717982]">
                                                    {product.categoryProduct.nameCategory}
                                                </p>
                                            )}
                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                                {discount > 0 && (
                                                    <del className="text-[#9aa0a6]">{formatPrice(price)}</del>
                                                )}
                                                <strong className="text-[#bd4147]">
                                                    {formatPrice(discountedPrice)}
                                                </strong>
                                                {discount > 0 && (
                                                    <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                                                        -{discount}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-[#687078]">
                                                <span>Số lượng: {quantity}</span>
                                                <strong className="text-[#303943]">
                                                    {formatPrice(discountedPrice * quantity)}
                                                </strong>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <aside className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm md:p-6 lg:sticky lg:top-5">
                    <h2 className="mb-5 text-lg font-bold text-[#29323d]">Thông Tin Đơn Hàng</h2>
                    <div className="space-y-4">
                        <Info
                            icon={CalendarDays}
                            label="Ngày đặt"
                            value={
                                payment.createdAt
                                    ? new Date(payment.createdAt).toLocaleString('vi-VN')
                                    : 'Đang cập nhật'
                            }
                        />
                        <Info
                            icon={CreditCard}
                            label="Phương thức thanh toán"
                            value={payment.paymentMethod === 'momo' ? 'Ví MoMo' : 'Thanh toán khi nhận hàng (COD)'}
                        />
                        <div>
                            <p className="text-xs text-[#747c84]">Trạng thái</p>
                            <span className="mt-1 inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                                {payment.status === 'pending' ? 'Chờ xác nhận' : payment.status}
                            </span>
                        </div>
                    </div>
                    <div className="mt-5 border-t border-[#e3e6e9] pt-4">
                        <h3 className="mb-3 font-bold text-[#303943]">Chi Tiết Thanh Toán</h3>
                        <div className="space-y-3 text-sm">
                            <PriceRow label="Tạm tính" value={formatPrice(payment.totalPrice)} />
                            {payment.couponId && (
                                <PriceRow
                                    label={`Giảm giá (${payment.couponId.nameCoupon || 'Mã giảm giá'}${payment.couponId.discount ? ` - ${payment.couponId.discount}%` : ''})`}
                                    value={`-${formatPrice((Number(payment.totalPrice) || 0) - (Number(payment.finalPrice) || 0))}`}
                                    highlight
                                />
                            )}
                            <PriceRow label="Phí vận chuyển" value="Miễn phí" />
                            <div className="flex justify-between gap-3 border-t border-[#e3e6e9] pt-3 text-base font-bold text-[#303943]">
                                <span>Tổng cộng</span>
                                <span className="text-[#bd4147]">
                                    {formatPrice(payment.finalPrice || payment.totalPrice)}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#f5f6f8]">
            <Header />
            <main className="mx-auto w-full max-w-[1380px] px-3 py-6 md:px-5 md:py-8">{content}</main>
        </div>
    );
}

function Info({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon className="mt-0.5 shrink-0 text-[#737b84]" size={17} />
            <div className="min-w-0">
                <p className="text-xs text-[#747c84]">{label}</p>
                <p className="mt-0.5 break-words text-sm font-semibold text-[#303943]">{value || 'Chưa cập nhật'}</p>
            </div>
        </div>
    );
}

function PriceRow({ label, value, highlight = false }) {
    return (
        <div className={`flex justify-between gap-3 ${highlight ? 'text-[#31845b]' : 'text-[#4e5862]'}`}>
            <span>{label}</span>
            <strong className="text-right">{value}</strong>
        </div>
    );
}

export default PaymentSuccessOrder;
