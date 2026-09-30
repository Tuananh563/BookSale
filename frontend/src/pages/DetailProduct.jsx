import Header from '../components/Header';
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Star, Zap } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { productDetail } from '../config/ProductRequest';
import { requestAddToCart } from '../config/CartRequest';
import { Button } from 'antd';
import { useStore } from '../hooks/useStore';

function formatPrice(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

const metadataLabels = {
    publisher: 'Nhà cung cấp',
    publishingHouse: 'Nhà xuất bản',
    size: 'Kích thước',
    traslator: 'Dịch giả',
    translator: 'Dịch giả',
    coverType: 'Loại bìa',
};

function DetailProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { dataUser, addToCart } = useStore();
    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState('');

    useEffect(() => {
        let isCurrent = true;
        const fetchProductDetail = async () => {
            try {
                setIsLoading(true);
                setError('');
                const res = await productDetail(id);
                if (isCurrent) {
                    setProduct(res?.metadata?.product || null);
                }
            } catch {
                if (isCurrent) setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
            } finally {
                if (isCurrent) setIsLoading(false);
            }
        };
        fetchProductDetail();
        return () => {
            isCurrent = false;
        };
    }, [id]);

    if (isLoading) {
        return (
            <>
                <Header />
                <main className="detail-page">
                    <div className="detail-message">Đang tải thông tin sản phẩm...</div>
                </main>
            </>
        );
    }

    if (error || !product) {
        return (
            <>
                <Header />
                <main className="detail-page">
                    <div className="detail-message detail-message--error">{error || 'Không tìm thấy sản phẩm.'}</div>
                </main>
            </>
        );
    }

    const images = product.imagesProduct || [];
    const discount = Number(product.discountProduct) || 0;
    const price = Number(product.priceProduct) || 0;
    const salePrice = price * (1 - discount / 100);
    const isOutOfStock = Number(product.stockProduct) <= 0;
    const metadata = Object.entries(product.metadata || {});

    const onLogin = () => {
        navigate('/login');
    };

    const addProductToCart = async () => {
        try {
            await requestAddToCart({ productId: id, quantity });
            const remainingStock = Number(product.stockProduct) - quantity;
            addToCart({ ...product, stockProduct: remainingStock }, quantity);
            setProduct((currentProduct) => ({ ...currentProduct, stockProduct: remainingStock }));
            setQuantity((currentQuantity) => Math.min(currentQuantity, remainingStock || 1));
            setNotification('Đã thêm sản phẩm vào giỏ hàng');
        } catch (requestError) {
            setNotification(requestError.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng');
        }
        window.setTimeout(() => setNotification(''), 2800);
    };

    return (
        <div>
            <Header />
            <main className="detail-page">
                {notification && (
                    <div className="detail-notification" role="status">
                        <ShoppingBag size={18} /> {notification}
                    </div>
                )}
                <button className="detail-back" type="button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={17} /> Quay lại cửa hàng
                </button>
                <div className="detail-layout">
                    <section className="detail-gallery" aria-label="Hình ảnh sản phẩm">
                        <div className="detail-gallery__main">
                            {images[selectedImage] ? (
                                <img src={images[selectedImage]} alt={product.nameProduct} />
                            ) : (
                                <span>Chưa có ảnh sản phẩm</span>
                            )}
                            {discount > 0 && <span className="detail-badge">-{discount}%</span>}
                        </div>
                        {images.length > 1 && (
                            <div className="detail-gallery__thumbs">
                                {images.map((image, index) => (
                                    <button
                                        className={
                                            index === selectedImage
                                                ? 'detail-thumb detail-thumb--active'
                                                : 'detail-thumb'
                                        }
                                        key={image}
                                        type="button"
                                        onClick={() => setSelectedImage(index)}
                                    >
                                        <img src={image} alt={`${product.nameProduct} ${index + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="detail-info">
                        <div className="detail-rating">
                            <Star size={17} fill="currentColor" /> 5.0 <span>Đánh giá sản phẩm</span>
                        </div>
                        <h1>{product.nameProduct}</h1>
                        <p className="detail-description">
                            {product.descriptionProduct || 'Sản phẩm chất lượng cao, phù hợp cho nhu cầu hằng ngày.'}
                        </p>
                        <div className="detail-price">
                            <strong>{formatPrice(salePrice)}</strong>
                            {discount > 0 && <del>{formatPrice(price)}</del>}
                            {discount > 0 && <span>Tiết kiệm {formatPrice(price - salePrice)}</span>}
                        </div>
                        <div className="detail-stock">
                            <span className={isOutOfStock ? 'is-empty' : ''}>
                                {isOutOfStock ? 'Hết hàng' : 'Còn hàng'}
                            </span>{' '}
                            · {isOutOfStock ? 'Sản phẩm hiện đang tạm hết' : `Còn ${product.stockProduct} sản phẩm`}
                        </div>
                        {!dataUser?._id ? (
                            <Button onClick={onLogin} type="primary" className="w-full">
                                Vui lòng đăng nhập để mua hàng
                            </Button>
                        ) : (
                            <div className="detail-actions">
                                <div className="quantity-control" aria-label="Số lượng">
                                    <button
                                        type="button"
                                        aria-label="Giảm số lượng"
                                        disabled={quantity <= 1}
                                        onClick={() => setQuantity((value) => value - 1)}
                                    >
                                        <Minus size={15} />
                                    </button>
                                    <span>{quantity}</span>
                                    <button
                                        type="button"
                                        aria-label="Tăng số lượng"
                                        disabled={quantity >= Number(product.stockProduct)}
                                        onClick={() => setQuantity((value) => value + 1)}
                                    >
                                        <Plus size={15} />
                                    </button>
                                </div>
                                <button
                                    className="detail-add"
                                    type="button"
                                    disabled={isOutOfStock}
                                    onClick={addProductToCart}
                                >
                                    <ShoppingBag size={18} /> Thêm vào giỏ hàng
                                </button>
                                <button
                                    className="detail-buy"
                                    type="button"
                                    disabled={isOutOfStock}
                                    onClick={addProductToCart}
                                >
                                    <Zap size={17} /> Mua ngay
                                </button>
                                <button className="detail-favorite" type="button" aria-label="Thêm vào yêu thích">
                                    <Heart size={19} />
                                </button>
                            </div>
                        )}

                        <div className="detail-meta">
                            <h2>Thông tin sản phẩm</h2>
                            {metadata.length > 0 ? (
                                metadata.map(([key, value]) => (
                                    <div className="detail-meta__row" key={key}>
                                        <span>{metadataLabels[key] || key}</span>
                                        <strong>{String(value)}</strong>
                                    </div>
                                ))
                            ) : (
                                <p>Chưa có thông tin bổ sung.</p>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default DetailProduct;
