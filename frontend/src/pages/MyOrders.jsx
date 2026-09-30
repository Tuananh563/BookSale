import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, Package, ShoppingBag } from 'lucide-react';
import Header from '../components/Header';
import { requestMyPayments } from '../config/paymentRequest';

function formatPrice(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    delivered: 'Đang giao hàng',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
};

function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        requestMyPayments()
            .then((response) => {
                if (active) setOrders(response?.metadata || []);
            })
            .catch((requestError) => {
                if (active) {
                    setError(
                        requestError.response?.data?.message || 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.',
                    );
                }
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#f5f6f8]">
            <Header />
            <main className="mx-auto w-full max-w-[1200px] px-4 py-8 md:py-10">
                <div className="mb-7 flex items-center gap-3">
                    <ClipboardList className="text-blue-700" size={27} />
                    <div>
                        <h1 className="text-2xl font-bold text-[#28313b]">Đơn hàng của tôi</h1>
                        <p className="mt-1 text-sm text-[#737b84]">Theo dõi các đơn hàng bạn đã đặt.</p>
                    </div>
                </div>

                {isLoading ? (
                    <section className="rounded-lg border border-[#e5e7eb] bg-white px-6 py-14 text-center text-[#68736d]">
                        Đang tải đơn hàng...
                    </section>
                ) : error ? (
                    <section className="rounded-lg border border-red-200 bg-white px-6 py-14 text-center text-red-700">
                        {error}
                    </section>
                ) : orders.length === 0 ? (
                    <section className="grid justify-items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-6 py-14 text-center">
                        <ShoppingBag className="text-[#849087]" size={38} />
                        <h2 className="text-lg font-semibold text-[#303943]">Bạn chưa có đơn hàng nào</h2>
                        <p className="text-sm text-[#737b84]">Các đơn hàng đã đặt sẽ được hiển thị tại đây.</p>
                        <Link
                            to="/"
                            className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Bắt đầu mua sắm <ArrowRight size={16} />
                        </Link>
                    </section>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const products = order.products || [];
                            const firstProduct = products[0]?.productId;
                            const extraCount = Math.max(products.length - 1, 0);
                            return (
                                <article
                                    key={order._id}
                                    className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm md:p-6"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f2] pb-4">
                                        <div>
                                            <p className="text-xs text-[#737b84]">Mã đơn hàng</p>
                                            <p className="mt-1 break-all font-mono text-sm font-semibold text-[#303943]">
                                                {order._id}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                order.status === 'cancelled'
                                                    ? 'bg-red-50 text-red-700'
                                                    : order.status === 'completed'
                                                      ? 'bg-green-50 text-green-700'
                                                      : 'bg-amber-50 text-amber-800'
                                            }`}
                                        >
                                            {statusLabels[order.status] || order.status || 'Đang cập nhật'}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
                                        <div className="flex min-w-0 flex-1 items-center gap-4">
                                            <div className="grid h-[76px] w-[64px] shrink-0 place-items-center overflow-hidden rounded bg-[#f3f5f2]">
                                                {firstProduct?.imagesProduct?.[0] ? (
                                                    <img
                                                        className="h-full w-full object-cover"
                                                        src={firstProduct.imagesProduct[0]}
                                                        alt={firstProduct.nameProduct || 'Sản phẩm'}
                                                    />
                                                ) : (
                                                    <Package className="text-[#849087]" size={24} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="line-clamp-2 font-semibold text-[#303943]">
                                                    {firstProduct?.nameProduct || 'Sản phẩm'}
                                                </p>
                                                <p className="mt-1 text-sm text-[#737b84]">
                                                    Số lượng: {products[0]?.quantity || 0}
                                                    {extraCount > 0 ? ` · và ${extraCount} sản phẩm khác` : ''}
                                                </p>
                                                <p className="mt-1 text-xs text-[#737b84]">
                                                    {order.createdAt
                                                        ? new Date(order.createdAt).toLocaleString('vi-VN')
                                                        : 'Ngày đặt chưa cập nhật'}
                                                    {' · '}
                                                    {order.paymentMethod === 'momo'
                                                        ? 'Ví MoMo'
                                                        : 'Thanh toán khi nhận hàng (COD)'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 border-t border-[#edf0f2] pt-4 sm:border-0 sm:pt-0">
                                            <div className="sm:text-right">
                                                <p className="text-xs text-[#737b84]">Tổng thanh toán</p>
                                                <p className="mt-1 font-bold text-[#bd4147]">
                                                    {formatPrice(order.finalPrice || order.totalPrice)}
                                                </p>
                                            </div>
                                            <Link
                                                to={`/payment-success/${order._id}`}
                                                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-[#d9dde2] px-3 text-sm font-semibold text-[#303943] hover:bg-[#f5f6f8]"
                                            >
                                                Chi tiết <ArrowRight size={15} />
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

export default MyOrders;
