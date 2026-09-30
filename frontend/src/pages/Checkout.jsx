import Header from '../components/Header';
import { useStore } from '../hooks/useStore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { CreditCard, Package, ShoppingBag, Wallet } from 'lucide-react';
import { requestUpdateInfoCart } from '../config/CartRequest';
import { requestPayment } from '../config/paymentRequest';

function formatPrice(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

function Checkout() {
    const { dataUser, cartItems = [], clearCart } = useStore();
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shippingInfo, setShippingInfo] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        address: '',
        note: '',
    });

    useEffect(() => {
        if (!dataUser) return;
        setShippingInfo((current) => ({
            ...current,
            fullName: current.fullName || dataUser.fullName || '',
            phoneNumber: current.phoneNumber || dataUser.phoneNumber || '',
            email: current.email || dataUser.email || '',
            address: current.address || dataUser.address || '',
        }));
    }, [dataUser]);

    const subtotal = cartItems.reduce((sum, item) => {
        return sum + (Number(item.priceProduct) || 0) * (Number(item.quantity) || 0);
    }, 0);
    const total = cartItems.reduce((sum, item) => {
        const price = Number(item.priceProduct) * (1 - (Number(item.discountProduct) || 0) / 100);
        return sum + price * (Number(item.quantity) || 0);
    }, 0);
    const discount = subtotal - total;
    const paymentMethods = [
        {
            id: 'cod',
            name: 'Thanh toán khi nhận hàng (COD)',
            description: 'Thanh toán bằng tiền mặt khi nhận hàng',
            icon: Package,
        },
        {
            id: 'momo',
            name: 'Ví MoMo',
            description: 'Thanh toán qua ví điện tử MoMo',
            icon: Wallet,
        },
    ];

    const handleSubmitOrder = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { fullName, phoneNumber, email, address } = shippingInfo;
            await requestUpdateInfoCart({ fullName, phoneNumber, email, address });
            const response = await requestPayment({ typePayment: paymentMethod });
            const payment = response?.metadata;

            if (paymentMethod === 'momo') {
                if (!payment?.payUrl) throw new Error('Không nhận được liên kết thanh toán MoMo');
                window.location.assign(payment.payUrl);
                return;
            }

            if (!payment?._id) throw new Error('Không nhận được mã đơn hàng');
            clearCart();
            navigate(`/payment-success/${payment._id}`);
        } catch (error) {
            message.error(error.response?.data?.message || error.message || 'Không thể tạo đơn hàng');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f6f8]">
            <Header />
            <main className="mx-auto w-full max-w-[1640px] px-3 py-4 md:px-4 md:py-5">
                {cartItems.length === 0 ? (
                    <section className="grid justify-items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white py-16 text-center shadow-sm">
                        <ShoppingBag size={38} className="text-[#4382c4]" />
                        <h2 className="text-xl font-semibold text-[#28313b]">Giỏ hàng đang trống</h2>
                        <p className="text-sm text-[#737b84]">Thêm sản phẩm vào giỏ hàng để tiếp tục thanh toán.</p>
                    </section>
                ) : (
                    <form
                        onSubmit={handleSubmitOrder}
                        className="grid items-start gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(360px,1fr)]"
                    >
                        <div className="space-y-6">
                            <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm md:p-7">
                                <h1 className="mb-5 text-xl font-bold text-[#29323d]">Thông Tin Giao Hàng</h1>
                                <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                                    <label className="grid gap-2 text-sm font-medium text-[#454c54]">
                                        Họ và tên <span className="sr-only">(bắt buộc)</span>
                                        <input
                                            required
                                            name="fullName"
                                            value={shippingInfo.fullName}
                                            onChange={(event) =>
                                                setShippingInfo({ ...shippingInfo, fullName: event.target.value })
                                            }
                                            placeholder="Nhập họ và tên"
                                            className="h-11 w-full rounded-md border border-[#d9dde2] px-4 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </label>
                                    <label className="grid gap-2 text-sm font-medium text-[#454c54]">
                                        Số điện thoại <span className="sr-only">(bắt buộc)</span>
                                        <input
                                            required
                                            type="tel"
                                            name="phoneNumber"
                                            value={shippingInfo.phoneNumber}
                                            onChange={(event) =>
                                                setShippingInfo({ ...shippingInfo, phoneNumber: event.target.value })
                                            }
                                            placeholder="Nhập số điện thoại"
                                            className="h-11 w-full rounded-md border border-[#d9dde2] px-4 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </label>
                                    <label className="grid gap-2 text-sm font-medium text-[#454c54] sm:col-span-2">
                                        Địa chỉ <span className="sr-only">(bắt buộc)</span>
                                        <input
                                            required
                                            name="address"
                                            value={shippingInfo.address}
                                            onChange={(event) =>
                                                setShippingInfo({ ...shippingInfo, address: event.target.value })
                                            }
                                            placeholder="Số nhà, tên đường"
                                            className="h-11 w-full rounded-md border border-[#d9dde2] px-4 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </label>
                                    <label className="grid gap-2 text-sm font-medium text-[#454c54] sm:col-span-2">
                                        Email <span className="sr-only">(bắt buộc)</span>
                                        <input
                                            required
                                            name="email"
                                            value={shippingInfo.email}
                                            onChange={(event) =>
                                                setShippingInfo({ ...shippingInfo, email: event.target.value })
                                            }
                                            placeholder="Email...."
                                            className="h-11 w-full rounded-md border border-[#d9dde2] px-4 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </label>
                                    <label className="grid gap-2 text-sm font-medium text-[#454c54] sm:col-span-2">
                                        Ghi chú
                                        <textarea
                                            name="note"
                                            rows={3}
                                            value={shippingInfo.note}
                                            onChange={(event) =>
                                                setShippingInfo({ ...shippingInfo, note: event.target.value })
                                            }
                                            placeholder="Ghi chú về đơn hàng (tùy chọn)"
                                            className="w-full resize-y rounded-md border border-[#d9dde2] px-4 py-3 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </label>
                                </div>
                            </section>

                            <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm md:p-7">
                                <h2 className="mb-5 text-xl font-bold text-[#29323d]">Phương Thức Thanh Toán</h2>
                                <div className="grid gap-3">
                                    {paymentMethods.map((method) => {
                                        const Icon = method.icon;
                                        const selected = paymentMethod === method.id;
                                        return (
                                            <label
                                                key={method.id}
                                                className={`flex cursor-pointer items-start gap-3 rounded-md border-2 p-4 transition ${
                                                    selected
                                                        ? 'border-[#4382c4] bg-[#f1f6fd]'
                                                        : 'border-[#e3e6e9] hover:border-[#b7cbe0]'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value={method.id}
                                                    checked={selected}
                                                    onChange={() => setPaymentMethod(method.id)}
                                                    className="mt-1 accent-[#4382c4]"
                                                />
                                                <Icon size={23} className="shrink-0 text-[#4382c4]" />
                                                <span className="grid gap-1">
                                                    <span className="text-sm font-semibold text-[#303943]">
                                                        {method.name}
                                                    </span>
                                                    <span className="text-sm text-[#717982]">{method.description}</span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>

                        <aside className="h-fit rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm md:p-6 lg:sticky lg:top-5">
                            <h2 className="mb-5 text-xl font-bold text-[#29323d]">Đơn Hàng</h2>
                            <div className="max-h-[420px] space-y-4 overflow-y-auto">
                                {cartItems.map((item) => {
                                    const price =
                                        Number(item.priceProduct) * (1 - (Number(item.discountProduct) || 0) / 100);
                                    const quantity = Number(item.quantity) || 0;
                                    return (
                                        <article className="flex gap-3 border-b border-[#edf0f2] pb-4" key={item._id}>
                                            <div className="grid h-[76px] w-[64px] shrink-0 place-items-center overflow-hidden rounded bg-[#f3f5f2]">
                                                {item.imagesProduct?.[0] ? (
                                                    <img
                                                        className="h-full w-full object-cover"
                                                        src={item.imagesProduct[0]}
                                                        alt={item.nameProduct || 'Sản phẩm'}
                                                    />
                                                ) : (
                                                    <ShoppingBag size={22} className="text-[#849087]" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="line-clamp-2 text-sm font-semibold text-[#303943]">
                                                    {item.nameProduct || 'Sản phẩm'}
                                                </h3>
                                                <p className="mt-1 text-xs text-[#717982]">Số lượng: {quantity}</p>
                                                <p className="mt-1 text-sm font-bold text-[#303943]">
                                                    {formatPrice(price * quantity)}
                                                </p>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                            <div className="mt-5 space-y-3 border-t border-[#e3e6e9] pt-4 text-sm">
                                <div className="flex justify-between gap-4 text-[#4e5862]">
                                    <span>Tạm tính</span>
                                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between gap-4 text-[#31845b]">
                                        <span>Giảm giá</span>
                                        <span className="font-semibold">-{formatPrice(discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between gap-4 text-[#4e5862]">
                                    <span>Phí vận chuyển</span>
                                    <span className="font-semibold">Miễn phí</span>
                                </div>
                                <div className="flex justify-between gap-4 border-t border-[#e3e6e9] pt-3 text-lg font-bold text-[#303943]">
                                    <span>Tổng cộng</span>
                                    <span className="text-[#c63f46]">{formatPrice(total)}</span>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-md bg-[#1769e8] px-4 text-base font-semibold text-white transition hover:bg-[#0f59ca]"
                            >
                                {isSubmitting ? 'Đang xử lý...' : 'Đặt Hàng'} <CreditCard size={18} />
                            </button>
                            <p className="mt-4 flex items-center gap-2 text-xs text-[#737b84]">
                                <Package size={15} className="shrink-0" /> Phương thức:{' '}
                                {paymentMethod === 'cod' ? 'COD' : 'MoMo'}
                            </p>
                        </aside>
                    </form>
                )}
            </main>
        </div>
    );
}
export default Checkout;
