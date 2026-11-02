import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    Box,
    Check,
    ChevronDown,
    CircleDollarSign,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Pencil,
    Plus,
    Search,
    ShoppingBag,
    Tag,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { apiClient } from '../config/axiosClient';
import { requestAuth, requestLogout } from '../config/UserRequest';
import { listProduct } from '../config/ProductRequest';
import { listCategory } from '../config/CategoryRequest';

const sections = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'products', label: 'Sản phẩm', icon: Package },
    { id: 'categories', label: 'Danh mục', icon: Tag },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag },
];

const orderStatuses = [
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipping', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
];

const emptyProduct = {
    nameProduct: '',
    priceProduct: '',
    discountProduct: '0',
    stockProduct: '0',
    categoryProduct: '',
};

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
const metadataOf = (response) => response?.metadata ?? response?.data?.metadata ?? [];

function Admin() {
    const navigate = useNavigate();
    const [section, setSection] = useState('overview');
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState('');
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState(emptyProduct);
    const [metadataFields, setMetadataFields] = useState([]);
    const [productImage, setProductImage] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryImage, setCategoryImage] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [saving, setSaving] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const refreshData = async () => {
        setLoading(true);
        setError('');
        try {
            const [productResponse, categoryResponse, orderResponse] = await Promise.all([
                listProduct(),
                listCategory(),
                apiClient.get('/api/payment/admin/list'),
            ]);
            setProducts(metadataOf(productResponse));
            setCategories(metadataOf(categoryResponse));
            setOrders(metadataOf(orderResponse));
        } catch (loadError) {
            setError(loadError.response?.data?.message || 'Không thể tải dữ liệu quản trị. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        requestAuth()
            .then((response) => {
                const currentUser = response.metadata;
                if (!active) return;
                if (!currentUser?.isAdmin) {
                    setError('Tài khoản hiện tại không có quyền quản trị.');
                    setLoading(false);
                    return;
                }
                setUser(currentUser);
                refreshData();
            })
            .catch(() => {
                if (active) navigate('/login', { replace: true });
            });
        return () => {
            active = false;
        };
    }, [navigate]);

    const filteredProducts = useMemo(
        () => products.filter((product) => product.nameProduct?.toLowerCase().includes(search.toLowerCase())),
        [products, search],
    );
    const filteredOrders = useMemo(
        () =>
            orders.filter((order) =>
                `${order.fullName || ''} ${order.email || ''} ${order._id || ''}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
            ),
        [orders, search],
    );
    const revenue = orders
        .filter((order) => order.status === 'delivered')
        .reduce((total, order) => total + Number(order.finalPrice || order.totalPrice || 0), 0);
    const currentSection = sections.find((item) => item.id === section);

    const flash = (message) => {
        setNotice(message);
        window.setTimeout(() => setNotice(''), 2800);
    };

    const openProductForm = (product = null) => {
        setEditingProduct(product);
        setProductImage(null);
        setMetadataFields(
            Object.entries(product?.metadata || {}).map(([key, value]) => ({ key, value: String(value) })),
        );
        setProductForm(
            product
                ? {
                      nameProduct: product.nameProduct || '',
                      priceProduct: product.priceProduct ?? '',
                      discountProduct: product.discountProduct ?? '0',
                      stockProduct: product.stockProduct ?? '0',
                      categoryProduct: product.categoryProduct?._id || product.categoryProduct || '',
                  }
                : { ...emptyProduct, categoryProduct: categories[0]?._id || '' },
        );
        setModal('product');
    };

    const saveProduct = async (event) => {
        event.preventDefault();
        if (!editingProduct && !productImage) {
            setError('Vui lòng chọn ít nhất một ảnh sản phẩm.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const form = new FormData();
            Object.entries(productForm).forEach(([key, value]) => form.append(key, value));
            const metadata = Object.fromEntries(
                metadataFields
                    .filter(({ key, value }) => key.trim() && value.trim())
                    .map(({ key, value }) => [key.trim(), value.trim()]),
            );
            form.append('metadata', JSON.stringify(metadata));
            if (editingProduct) form.append('oldImagesProduct', JSON.stringify(editingProduct.imagesProduct || []));
            if (productImage) form.append('imagesProduct', productImage);
            const response = editingProduct
                ? await apiClient.put(`/api/product/update/${editingProduct._id}`, form)
                : await apiClient.post('/api/product/create', form);
            const savedProduct = metadataOf(response);
            setProducts((current) =>
                editingProduct
                    ? current.map((item) => (item._id === editingProduct._id ? savedProduct : item))
                    : [savedProduct, ...current],
            );
            setModal('');
            flash(editingProduct ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm mới.');
        } catch (saveError) {
            setError(saveError.response?.data?.message || 'Lưu sản phẩm thất bại.');
        } finally {
            setSaving(false);
        }
    };

    const deleteProduct = async (product) => {
        if (!window.confirm(`Xóa sản phẩm “${product.nameProduct}”?`)) return;
        try {
            await apiClient.delete(`/api/product/delete/${product._id}`);
            setProducts((current) => current.filter((item) => item._id !== product._id));
            flash('Đã xóa sản phẩm.');
        } catch (deleteError) {
            setError(deleteError.response?.data?.message || 'Xóa sản phẩm thất bại.');
        }
    };

    const openCategoryForm = (category = null) => {
        setEditingCategory(category);
        setCategoryName(category?.nameCategory || '');
        setCategoryImage(null);
        setModal('category');
    };

    const saveCategory = async (event) => {
        event.preventDefault();
        if (!editingCategory && !categoryImage) {
            setError('Vui lòng chọn ảnh danh mục.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const form = new FormData();
            form.append('nameCategory', categoryName);
            if (categoryImage) form.append('imageCategory', categoryImage);
            const response = editingCategory
                ? await apiClient.put(`/api/category/update/${editingCategory._id}`, form)
                : await apiClient.post('/api/category/create', form);
            const savedCategory = metadataOf(response);
            setCategories((current) =>
                editingCategory
                    ? current.map((item) => (item._id === editingCategory._id ? savedCategory : item))
                    : [...current, savedCategory],
            );
            setCategoryName('');
            setCategoryImage(null);
            setEditingCategory(null);
            setModal('');
            flash(editingCategory ? 'Đã cập nhật danh mục.' : 'Đã tạo danh mục.');
        } catch (saveError) {
            setError(saveError.response?.data?.message || 'Tạo danh mục thất bại.');
        } finally {
            setSaving(false);
        }
    };

    const deleteCategory = async (category) => {
        if (!window.confirm(`Xóa danh mục “${category.nameCategory}”?`)) return;
        try {
            await apiClient.delete(`/api/category/delete/${category._id}`);
            setCategories((current) => current.filter((item) => item._id !== category._id));
            flash('Đã xóa danh mục.');
        } catch (deleteError) {
            setError(deleteError.response?.data?.message || 'Xóa danh mục thất bại.');
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            const response = await apiClient.put(`/api/payment/admin/update/${orderId}`, { status });
            const updated = metadataOf(response);
            setOrders((current) => current.map((order) => (order._id === orderId ? { ...order, ...updated } : order)));
            flash('Đã cập nhật trạng thái đơn hàng.');
        } catch (updateError) {
            setError(updateError.response?.data?.message || 'Cập nhật đơn hàng thất bại.');
        }
    };

    const logout = async () => {
        try {
            await requestLogout();
        } finally {
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="admin-shell">
            <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
                <Link className="admin-brand" to="/">
                    <span className="admin-brand__mark">AT</span>
                    <span>
                        <strong>Sales Shop</strong>
                        <small>BACK OFFICE</small>
                    </span>
                </Link>
                <div className="admin-nav-label">QUẢN LÝ CỬA HÀNG</div>
                <nav className="admin-nav" aria-label="Điều hướng quản trị">
                    {sections.map(({ id, label, icon: Icon }) => (
                        <button
                            className={`admin-nav__item ${section === id ? 'admin-nav__item--active' : ''}`}
                            key={id}
                            onClick={() => {
                                setSection(id);
                                setSearch('');
                                setSidebarOpen(false);
                            }}
                        >
                            <Icon size={18} strokeWidth={1.8} />
                            {label}
                            {id === 'orders' && orders.filter((order) => order.status === 'pending').length > 0 && (
                                <span className="admin-nav__badge">
                                    {orders.filter((order) => order.status === 'pending').length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="admin-sidebar__bottom">
                    <Link className="admin-back-link" to="/">
                        <ArrowLeft size={16} /> Trở về cửa hàng
                    </Link>
                    <div className="admin-profile">
                        <div className="admin-profile__avatar">
                            {(user?.fullname || user?.fullName || 'A').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="admin-profile__info">
                            <strong>{user?.fullname || user?.fullName || 'Quản trị viên'}</strong>
                            <span>Quản trị viên</span>
                        </div>
                        <button className="admin-icon-button" onClick={logout} title="Đăng xuất" aria-label="Đăng xuất">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {sidebarOpen && (
                <button className="admin-sidebar-scrim" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />
            )}

            <main className="admin-main">
                <header className="admin-topbar">
                    <button
                        className="admin-icon-button admin-menu-toggle"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Mở menu"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="admin-breadcrumb">
                        <Link to="/">Cửa hàng</Link>
                        <span>/</span>
                        <strong>{currentSection?.label}</strong>
                    </div>
                    <div className="admin-topbar__right">
                        <span className="admin-live-dot" /> Hoạt động bình thường
                    </div>
                </header>
                <div className="admin-content">
                    <div className="admin-page-heading">
                        <div>
                            <p>KHÔNG GIAN QUẢN TRỊ</p>
                            <h1>{section === 'overview' ? 'Chào buổi tối' : currentSection?.label}</h1>
                            <p className="admin-subtitle">
                                {section === 'overview'
                                    ? 'Theo dõi tình hình cửa hàng của bạn.'
                                    : `Quản lý ${currentSection?.label.toLowerCase()} trong cửa hàng.`}
                            </p>
                        </div>
                        <div className="admin-heading-actions">
                            {(section === 'products' || section === 'categories') && (
                                <button
                                    className="admin-primary-button"
                                    onClick={() =>
                                        section === 'products' ? openProductForm() : openCategoryForm()
                                    }
                                >
                                    <Plus size={17} />
                                    {section === 'products' ? 'Thêm sản phẩm' : 'Thêm danh mục'}
                                </button>
                            )}
                        </div>
                    </div>
                    {error && (
                        <div className="admin-alert" role="alert">
                            <span>{error}</span>
                            <button
                                className="admin-icon-button"
                                onClick={() => setError('')}
                                aria-label="Đóng thông báo"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    {notice && (
                        <div className="admin-toast">
                            <Check size={16} />
                            {notice}
                        </div>
                    )}
                    {loading ? (
                        <div className="admin-loading">
                            <span />
                            Đang tải dữ liệu cửa hàng
                        </div>
                    ) : error && !user ? null : (
                        <>
                            {section === 'overview' && (
                                <Overview
                                    products={products}
                                    orders={orders}
                                    revenue={revenue}
                                    setSection={setSection}
                                />
                            )}
                            {section === 'products' && (
                                <ProductsSection
                                    products={filteredProducts}
                                    search={search}
                                    setSearch={setSearch}
                                    onEdit={openProductForm}
                                    onDelete={deleteProduct}
                                />
                            )}
                            {section === 'categories' && (
                                <CategoriesSection
                                    categories={categories}
                                    products={products}
                                    onEdit={openCategoryForm}
                                    onDelete={deleteCategory}
                                />
                            )}
                            {section === 'orders' && (
                                <OrdersSection
                                    orders={filteredOrders}
                                    search={search}
                                    setSearch={setSearch}
                                    onUpdate={updateOrderStatus}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>

            {modal === 'product' && (
                <Modal title={editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'} onClose={() => setModal('')}>
                    <form className="admin-form" onSubmit={saveProduct}>
                        <label>
                            Tên sản phẩm
                            <input
                                required
                                value={productForm.nameProduct}
                                onChange={(event) =>
                                    setProductForm({ ...productForm, nameProduct: event.target.value })
                                }
                                placeholder="Ví dụ: Trà xanh hữu cơ"
                            />
                        </label>
                        <div className="admin-form__row">
                            <label>
                                Giá bán (đ)
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    value={productForm.priceProduct}
                                    onChange={(event) =>
                                        setProductForm({ ...productForm, priceProduct: event.target.value })
                                    }
                                />
                            </label>
                            <label>
                                Giảm giá (%)
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={productForm.discountProduct}
                                    onChange={(event) =>
                                        setProductForm({ ...productForm, discountProduct: event.target.value })
                                    }
                                />
                            </label>
                        </div>
                        <div className="admin-form__row">
                            <label>
                                Tồn kho
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    value={productForm.stockProduct}
                                    onChange={(event) =>
                                        setProductForm({ ...productForm, stockProduct: event.target.value })
                                    }
                                />
                            </label>
                            <label>
                                Danh mục
                                <select
                                    required
                                    value={productForm.categoryProduct}
                                    onChange={(event) =>
                                        setProductForm({ ...productForm, categoryProduct: event.target.value })
                                    }
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map((category) => (
                                        <option value={category._id} key={category._id}>
                                            {category.nameCategory}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="admin-metadata">
                            <div className="admin-metadata__heading">
                                <span>Thông tin bổ sung</span>
                                <button
                                    className="admin-secondary-button"
                                    type="button"
                                    onClick={() => setMetadataFields([...metadataFields, { key: '', value: '' }])}
                                >
                                    <Plus size={14} />
                                    Thêm thông tin
                                </button>
                            </div>
                            {metadataFields.map((field, index) => (
                                <div className="admin-form__row admin-metadata__row" key={index}>
                                    <label>
                                        Tên thông tin
                                        <input
                                            value={field.key}
                                            placeholder="Ví dụ: Nhà xuất bản"
                                            onChange={(event) =>
                                                setMetadataFields(
                                                    metadataFields.map((item, fieldIndex) =>
                                                        fieldIndex === index
                                                            ? { ...item, key: event.target.value }
                                                            : item,
                                                    ),
                                                )
                                            }
                                        />
                                    </label>
                                    <label>
                                        Giá trị
                                        <span className="admin-metadata__value">
                                            <input
                                                value={field.value}
                                                placeholder="Ví dụ: Nhã Nam"
                                                onChange={(event) =>
                                                    setMetadataFields(
                                                        metadataFields.map((item, fieldIndex) =>
                                                            fieldIndex === index
                                                                ? { ...item, value: event.target.value }
                                                                : item,
                                                        ),
                                                    )
                                                }
                                            />
                                            <button
                                                className="admin-icon-button admin-danger-icon"
                                                type="button"
                                                aria-label="Xóa thông tin"
                                                onClick={() =>
                                                    setMetadataFields(
                                                        metadataFields.filter((_, fieldIndex) => fieldIndex !== index),
                                                    )
                                                }
                                            >
                                                <X size={15} />
                                            </button>
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <label>
                            Ảnh sản phẩm
                            {editingProduct && (
                                <small className="admin-field-hint">Ảnh mới sẽ được thêm vào bộ ảnh hiện tại.</small>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                required={!editingProduct}
                                onChange={(event) => setProductImage(event.target.files?.[0] || null)}
                            />
                        </label>
                        <div className="admin-modal__actions">
                            <button type="button" className="admin-secondary-button" onClick={() => setModal('')}>
                                Hủy
                            </button>
                            <button className="admin-primary-button" disabled={saving}>
                                {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
            {modal === 'category' && (
                <Modal
                    title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}
                    onClose={() => setModal('')}
                >
                    <form className="admin-form" onSubmit={saveCategory}>
                        <label>
                            Tên danh mục
                            <input
                                required
                                value={categoryName}
                                onChange={(event) => setCategoryName(event.target.value)}
                                placeholder="Ví dụ: Trà thảo mộc"
                            />
                        </label>
                        <label>
                            Ảnh danh mục
                            <input
                                type="file"
                                accept="image/*"
                                required={!editingCategory}
                                onChange={(event) => setCategoryImage(event.target.files?.[0] || null)}
                            />
                            {editingCategory && (
                                <small className="admin-field-hint">
                                    Để trống nếu bạn không muốn thay đổi ảnh hiện tại.
                                </small>
                            )}
                        </label>
                        <div className="admin-modal__actions">
                            <button type="button" className="admin-secondary-button" onClick={() => setModal('')}>
                                Hủy
                            </button>
                            <button className="admin-primary-button" disabled={saving}>
                                {saving ? 'Đang lưu...' : editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

function Overview({ products, orders, revenue, setSection }) {
    const pending = orders.filter((order) => order.status === 'pending').length;
    const delivered = orders.filter((order) => order.status === 'delivered').length;
    const metrics = [
        {
            label: 'Doanh thu đã giao',
            value: money(revenue),
            delta: `${delivered} đơn hoàn tất`,
            icon: CircleDollarSign,
            tone: 'green',
            trend: 'up',
        },
        {
            label: 'Đơn hàng',
            value: orders.length.toLocaleString('vi-VN'),
            delta: `${pending} đơn cần xử lý`,
            icon: ShoppingBag,
            tone: 'orange',
            trend: pending ? 'down' : 'up',
        },
        {
            label: 'Sản phẩm',
            value: products.length.toLocaleString('vi-VN'),
            delta: `${products.filter((product) => Number(product.stockProduct) <= 5).length} sắp hết hàng`,
            icon: Package,
            tone: 'blue',
            trend: 'up',
        },
        {
            label: 'Khách hàng',
            value: new Set(
                orders.map((order) => order.userId?._id || order.userId).filter(Boolean),
            ).size.toLocaleString('vi-VN'),
            delta: 'Có đơn hàng',
            icon: Users,
            tone: 'rose',
            trend: 'up',
        },
    ];
    const recentOrders = [...orders]
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
        .slice(0, 5);
    const weekly = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label, index) => ({
        label,
        value: orders.filter((order) => new Date(order.createdAt).getDay() === (index + 1) % 7).length,
    }));
    const maxOrders = Math.max(...weekly.map((item) => item.value), 1);

    return (
        <>
            <section className="admin-metrics">
                {metrics.map(({ label, value, delta, icon: Icon, tone, trend }) => (
                    <article className="admin-metric" key={label}>
                        <div className="admin-metric__top">
                            <span>{label}</span>
                            <span className={`admin-metric__icon admin-metric__icon--${tone}`}>
                                <Icon size={19} />
                            </span>
                        </div>
                        <strong>{value}</strong>
                        <div className="admin-metric__foot">
                            <span className={`admin-trend admin-trend--${trend}`}>
                                {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {delta}
                            </span>
                            <span>hiện tại</span>
                        </div>
                    </article>
                ))}
            </section>
            <section className="admin-overview-grid">
                <article className="admin-panel admin-chart-panel">
                    <div className="admin-panel__heading">
                        <div>
                            <h2>Nhịp độ cửa hàng</h2>
                            <p>Đơn hàng trong tuần này</p>
                        </div>
                        <span className="admin-period">
                            <ChevronDown size={14} /> 7 ngày qua
                        </span>
                    </div>
                    <div className="admin-chart">
                        <div className="admin-chart__grid">
                            <span>100</span>
                            <span>75</span>
                            <span>50</span>
                            <span>25</span>
                        </div>
                        <div className="admin-chart__bars">
                            {weekly.map((bar) => (
                                <div className="admin-chart__column" key={bar.label}>
                                    <div
                                        className="admin-chart__bar"
                                        style={{ height: `${Math.max(9, (bar.value / maxOrders) * 100)}%` }}
                                        title={`${bar.value} đơn`}
                                    >
                                        <span>{bar.value || ''}</span>
                                    </div>
                                    <small>{bar.label}</small>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="admin-chart-legend">
                        <span />
                        <small>Đơn hàng đã tạo</small>
                    </div>
                </article>
                <article className="admin-panel admin-inventory-panel">
                    <div className="admin-panel__heading">
                        <div>
                            <h2>Tình trạng kho</h2>
                            <p>Sản phẩm cần chú ý</p>
                        </div>
                        <button className="admin-text-button" onClick={() => setSection('products')}>
                            Xem tất cả <ArrowUpRight size={14} />
                        </button>
                    </div>
                    <div className="admin-inventory-summary">
                        <span className="admin-inventory-summary__icon">
                            <Box size={18} />
                        </span>
                        <div>
                            <strong>
                                {products.reduce((total, product) => total + Number(product.stockProduct || 0), 0)}
                            </strong>
                            <small>Tổng sản phẩm trong kho</small>
                        </div>
                    </div>
                    <div className="admin-low-stock">
                        {products
                            .filter((product) => Number(product.stockProduct) <= 5)
                            .slice(0, 4)
                            .map((product) => (
                                <div className="admin-low-stock__item" key={product._id}>
                                    <img src={product.imagesProduct?.[0]} alt="" />
                                    <span>{product.nameProduct}</span>
                                    <b>{product.stockProduct} còn</b>
                                </div>
                            ))}
                        {products.every((product) => Number(product.stockProduct) > 5) && (
                            <p className="admin-empty-small">Tất cả sản phẩm đang đủ hàng.</p>
                        )}
                    </div>
                </article>
            </section>
            <section className="admin-panel admin-recent-panel">
                <div className="admin-panel__heading">
                    <div>
                        <h2>Đơn hàng gần đây</h2>
                        <p>Cập nhật mới nhất từ khách hàng</p>
                    </div>
                    <button className="admin-text-button" onClick={() => setSection('orders')}>
                        Tất cả đơn hàng <ArrowUpRight size={14} />
                    </button>
                </div>
                <OrderTable orders={recentOrders} compact />
            </section>
        </>
    );
}

function ProductsSection({ products, search, setSearch, onEdit, onDelete }) {
    return (
        <section className="admin-panel admin-table-panel">
            <div className="admin-toolbar">
                <div className="admin-search">
                    <Search size={17} />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Tìm sản phẩm..."
                    />
                </div>
                <span className="admin-result-count">{products.length} sản phẩm</span>
            </div>
            <div className="admin-table-scroll">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>SẢN PHẨM</th>
                            <th>GIÁ BÁN</th>
                            <th>TỒN KHO</th>
                            <th>TRẠNG THÁI</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product._id}>
                                <td>
                                    <div className="admin-product-cell">
                                        <img src={product.imagesProduct?.[0]} alt="" />
                                        <div>
                                            <strong>{product.nameProduct}</strong>
                                            <small>{product.categoryProduct?.nameCategory || 'Sản phẩm'}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <strong>{money(product.priceProduct)}</strong>
                                    {Number(product.discountProduct) > 0 && (
                                        <small className="admin-old-price">Giảm {product.discountProduct}%</small>
                                    )}
                                </td>
                                <td>{product.stockProduct}</td>
                                <td>
                                    <span
                                        className={`admin-stock-status ${Number(product.stockProduct) <= 5 ? 'admin-stock-status--low' : ''}`}
                                    >
                                        <span />
                                        {Number(product.stockProduct) <= 5 ? 'Sắp hết hàng' : 'Đang bán'}
                                    </span>
                                </td>
                                <td>
                                    <div className="admin-row-actions">
                                        <button
                                            className="admin-secondary-button admin-small-button"
                                            onClick={() => onEdit(product)}
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            className="admin-icon-button admin-danger-icon"
                                            onClick={() => onDelete(product)}
                                            title="Xóa sản phẩm"
                                            aria-label={`Xóa ${product.nameProduct}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && (
                    <EmptyState
                        title="Chưa có sản phẩm"
                        description="Thử tìm bằng từ khóa khác hoặc tạo sản phẩm mới."
                    />
                )}
            </div>
        </section>
    );
}

function CategoriesSection({ categories, products, onEdit, onDelete }) {
    return (
        <section className="admin-panel admin-category-panel">
            <div className="admin-panel__heading">
                <div>
                    <h2>Danh mục cửa hàng</h2>
                    <p>{categories.length} danh mục đang hoạt động</p>
                </div>
            </div>
            <div className="admin-category-grid">
                {categories.map((category) => (
                    <article className="admin-category-item" key={category._id}>
                        <img src={category.imageCategory} alt="" />
                        <div>
                            <strong>{category.nameCategory}</strong>
                            <small>
                                {
                                    products.filter(
                                        (product) =>
                                            (product.categoryProduct?._id || product.categoryProduct) === category._id,
                                    ).length
                                }{' '}
                                sản phẩm
                            </small>
                        </div>
                        <div className="admin-row-actions">
                            <button
                                className="admin-icon-button"
                                onClick={() => onEdit(category)}
                                title="Sửa danh mục"
                                aria-label={`Sửa ${category.nameCategory}`}
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                className="admin-icon-button admin-danger-icon"
                                onClick={() => onDelete(category)}
                                title="Xóa danh mục"
                                aria-label={`Xóa ${category.nameCategory}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </article>
                ))}
            </div>
            {categories.length === 0 && (
                <EmptyState title="Chưa có danh mục" description="Tạo danh mục đầu tiên cho cửa hàng." />
            )}
        </section>
    );
}

function OrdersSection({ orders, search, setSearch, onUpdate }) {
    return (
        <section className="admin-panel admin-table-panel">
            <div className="admin-toolbar">
                <div className="admin-search">
                    <Search size={17} />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Tìm khách hàng hoặc mã đơn..."
                    />
                </div>
                <span className="admin-result-count">{orders.length} đơn hàng</span>
            </div>
            <div className="admin-table-scroll">
                <OrderTable orders={orders} onUpdate={onUpdate} />
                {orders.length === 0 && (
                    <EmptyState title="Không tìm thấy đơn hàng" description="Các đơn hàng sẽ xuất hiện ở đây." />
                )}
            </div>
        </section>
    );
}

function OrderTable({ orders, onUpdate }) {
    return (
        <table className="admin-table">
            <thead>
                <tr>
                    <th>MÃ ĐƠN</th>
                    <th>KHÁCH HÀNG</th>
                    <th>NGÀY ĐẶT</th>
                    <th>TỔNG TIỀN</th>
                    <th>TRẠNG THÁI</th>
                    {onUpdate && <th>CẬP NHẬT</th>}
                </tr>
            </thead>
            <tbody>
                {orders.map((order) => (
                    <tr key={order._id}>
                        <td>
                            <strong className="admin-order-id">#{String(order._id).slice(-7).toUpperCase()}</strong>
                            <small>{order.products?.length || 0} mặt hàng</small>
                        </td>
                        <td>
                            <strong>{order.fullName || order.userId?.fullName || 'Khách hàng'}</strong>
                            <small>{order.email || order.userId?.email || ''}</small>
                        </td>
                        <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                        <td>
                            <strong>{money(order.finalPrice || order.totalPrice)}</strong>
                        </td>
                        <td>
                            <StatusBadge status={order.status} />
                        </td>
                        {onUpdate && (
                            <td>
                                <select
                                    className="admin-status-select"
                                    value={order.status || 'pending'}
                                    onChange={(event) => onUpdate(order._id, event.target.value)}
                                    aria-label="Cập nhật trạng thái"
                                >
                                    {orderStatuses.map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function StatusBadge({ status }) {
    const label = orderStatuses.find((item) => item.value === status)?.label || status || 'Chưa rõ';
    return (
        <span className={`admin-order-status admin-order-status--${status || 'pending'}`}>
            <span />
            {label}
        </span>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="admin-empty-state">
            <span>
                <Package size={21} />
            </span>
            <strong>{title}</strong>
            <p>{description}</p>
        </div>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <div
            className="admin-modal-backdrop"
            onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
            <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
                <header>
                    <h2 id="admin-modal-title">{title}</h2>
                    <button className="admin-icon-button" onClick={onClose} aria-label="Đóng">
                        <X size={19} />
                    </button>
                </header>
                {children}
            </section>
        </div>
    );
}

export default Admin;
