import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { message } from 'antd';
import { requestAddToCart } from '../config/CartRequest';
import { useStore } from '../hooks/useStore';
function formatPrice(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

function CardBody({ dataItem }) {
    const navigate = useNavigate();
    const { dataUser, addToCart } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [availableStock, setAvailableStock] = useState(Number(dataItem.stockProduct) || 0);
    const {
        nameProduct,
        imagesProduct = [],
        priceProduct = 0,
        discountProduct = 0,
        descriptionProduct = '',
        metadata = {},
    } = dataItem;
    const discount = Number(discountProduct) || 0;
    const price = Number(priceProduct) || 0;
    const salePrice = price * (1 - discount / 100);
    const image = imagesProduct[0];
    const isOutOfStock = availableStock <= 0;
    const metadataValues = Object.entries(metadata || {}).slice(0, 3);

    const handleAddToCart = async () => {
        if (!dataUser?._id) {
            navigate('/login');
            return;
        }
        if (isAdding || isOutOfStock) return;

        setIsAdding(true);
        try {
            await requestAddToCart({ productId: dataItem._id, quantity: 1 });
            const remainingStock = Math.max(availableStock - 1, 0);
            addToCart({ ...dataItem, stockProduct: remainingStock }, 1);
            setAvailableStock(remainingStock);
            message.success('Đã thêm sản phẩm vào giỏ hàng');
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <article id={`product-${dataItem._id}`} className="product-card">
            <div className="product-card__visual">
                {image ? (
                    <img className="product-card__image" src={image} alt={nameProduct} />
                ) : (
                    <div className="product-card__placeholder">Chưa có ảnh</div>
                )}
                {discount > 0 && <span className="product-card__badge">-{discount}%</span>}
                <button className="product-card__favorite" type="button" aria-label="Thêm vào yêu thích">
                    <Heart size={18} />
                </button>
                {isOutOfStock && <span className="product-card__sold-out">Hết hàng</span>}
            </div>

            <div className="product-card__content">
                <div className="product-card__rating" aria-label="Đánh giá 5 sao">
                    <Star size={15} fill="currentColor" />
                    <span>5.0</span>
                    <span className="product-card__reviews">Sản phẩm mới</span>
                </div>
                <Link to={`/product/${dataItem._id}`}>
                    <h3 className="product-card__name">{nameProduct || 'Sản phẩm chưa đặt tên'}</h3>
                </Link>
                <p className="product-card__description">
                    {descriptionProduct || 'Sản phẩm chất lượng cao, phù hợp cho nhu cầu hằng ngày.'}
                </p>

                {metadataValues.length > 0 && (
                    <div className="product-card__details">
                        {metadataValues.map(([key, value]) => (
                            <span key={key}>{`${key}: ${String(value)}`}</span>
                        ))}
                    </div>
                )}

                <div className="product-card__footer">
                    <div>
                        <strong className="product-card__price">{formatPrice(salePrice)}</strong>
                        {discount > 0 && <del className="product-card__old-price">{formatPrice(price)}</del>}
                    </div>
                    <span className="product-card__stock">
                        {isOutOfStock ? 'Tạm hết' : `Còn ${availableStock} sản phẩm`}
                    </span>
                </div>

                <button
                    className="product-card__add"
                    type="button"
                    disabled={isOutOfStock || isAdding}
                    onClick={handleAddToCart}
                >
                    <ShoppingBag size={17} />
                    {isOutOfStock ? 'Hết hàng' : isAdding ? 'Đang thêm...' : 'Thêm vào giỏ'}
                </button>
            </div>
        </article>
    );
}

export default CardBody;
