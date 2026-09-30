import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listCategory } from '../config/CategoryRequest';
import { listProduct, listProductByCategory } from '../config/ProductRequest';
import CardBody from './CardBody';

function Homepage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [dataCategory, setDataCategory] = useState([]);
    const [dataProduct, setDataProduct] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    // Mặc định chọn tất cả sản phẩm bằng giá trị null
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Lấy dữ liệu danh mục và tất cả sản phẩm lần đầu khi load trang
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [categoryResponse, productResponse] = await Promise.all([listCategory(), listProduct()]);

                if (isMounted) {
                    setDataCategory(categoryResponse.metadata || []);
                    setDataProduct(productResponse.metadata || []);
                }
            } catch {
                if (isMounted) {
                    setErrorMessage('Không thể tải sản phẩm. Vui lòng kiểm tra backend đang chạy ở cổng 3000.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const productId = new URLSearchParams(location.search).get('product');
        if (!productId) return;

        const targetProduct = dataProduct.find((product) => product._id === productId);
        if (targetProduct && !isLoading) {
            document.getElementById(`product-${productId}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            navigate('/', { replace: true });
            return;
        }

        if (!isLoading && selectedCategory !== null) {
            setSelectedCategory(null);
            setIsLoading(true);
            listProduct()
                .then((response) => setDataProduct(response.metadata || []))
                .catch(() => setErrorMessage('Không thể tải sản phẩm cần tìm.'))
                .finally(() => setIsLoading(false));
        }
    }, [dataProduct, isLoading, location.search, navigate, selectedCategory]);

    // Xử lý khi người dùng chọn danh mục (Fetch theo API hoặc Lọc client)
    const handleSelectCategory = async (categoryId) => {
        setSelectedCategory(categoryId);
        setIsLoading(true);
        setErrorMessage('');

        try {
            if (categoryId === null) {
                // Tải lại tất cả sản phẩm
                const response = await listProduct();
                setDataProduct(response.metadata || []);
            } else {
                // Tải sản phẩm theo Danh mục từ backend
                const response = await listProductByCategory(categoryId);
                setDataProduct(response.metadata || []);
            }
        } catch {
            setErrorMessage('Không thể tải dữ liệu sản phẩm cho danh mục này.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="shop-layout">
            <aside className="category-sidebar">
                <div className="category-sidebar__heading">
                    <span className="section-kicker">Khám phá</span>
                    <h2>Danh mục</h2>
                </div>
                <div className="category-list">
                    <button
                        className={`category-item ${selectedCategory === null ? 'category-item--active' : ''}`}
                        type="button"
                        onClick={() => handleSelectCategory(null)}
                    >
                        <img src="https://cdn-icons-png.flaticon.com/512/25/25694.png" alt="Tất cả sản phẩm" />
                        <span>Tất cả sản phẩm</span>
                    </button>
                    {dataCategory.map((item) => (
                        <button
                            className={`category-item ${selectedCategory === item._id ? 'category-item--active' : ''}`}
                            key={item._id}
                            type="button"
                            onClick={() => handleSelectCategory(item._id)}
                        >
                            <img src={item.imageCategory} alt={item.nameCategory} />
                            <span>{item.nameCategory}</span>
                        </button>
                    ))}
                </div>
            </aside>

            <div className="product-section">
                <div className="product-section__heading">
                    <div>
                        <span className="section-kicker">Bộ sưu tập mới</span>
                        <h1>Sản phẩm nổi bật</h1>
                    </div>
                    <span className="product-count">{isLoading ? '...' : `${dataProduct.length} sản phẩm`}</span>
                </div>

                {isLoading && <p className="data-message">Đang tải sản phẩm...</p>}

                {!isLoading && errorMessage && <p className="data-message data-message--error">{errorMessage}</p>}

                {!isLoading && !errorMessage && dataProduct.length === 0 && (
                    <p className="data-message">Chưa có sản phẩm để hiển thị.</p>
                )}

                {!isLoading && !errorMessage && dataProduct.length > 0 && (
                    <div className="product-grid">
                        {dataProduct.map((item) => (
                            <CardBody key={item._id} dataItem={item} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default Homepage;
