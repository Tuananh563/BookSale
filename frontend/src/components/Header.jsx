import { ChevronDown, ClipboardList, LogOut, Search, ShoppingBag, User, UserCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { requestLogout } from '../config/UserRequest';
import { listProduct } from '../config/ProductRequest';

function normalizeSearch(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('vi');
}

function formatPrice(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

function Header() {
    const { dataUser, setDataUser, cartCount } = useStore();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [products, setProducts] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        let active = true;
        listProduct()
            .then((response) => {
                if (active) setProducts(response?.metadata || []);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);

    const normalizedSearch = normalizeSearch(searchText.trim());
    const suggestions = normalizedSearch
        ? products
              .filter((product) => normalizeSearch(product.nameProduct || '').includes(normalizedSearch))
              .slice(0, 6)
        : [];

    const selectProduct = (product) => {
        setSearchText('');
        setIsSearchOpen(false);
        navigate(`/?product=${encodeURIComponent(product._id)}`);
    };

    const userName = dataUser?.fullname || dataUser?.name || dataUser?.email || 'Tài khoản';
    const handleLogout = async () => {
        try {
            await requestLogout();
        } finally {
            setDataUser(null);
            setIsMenuOpen(false);
            navigate('/');
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
            <div className="mx-auto flex h-[80px] max-w-[1200px] items-center gap-8 px-4">
                {/* LOGO */}
                <Link to="/">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-700 to-blue-500 text-xl font-bold text-white shadow">
                            AT
                        </div>

                        <span className="text-2xl font-bold text-blue-600">Sales Shop</span>
                    </div>
                </Link>

                {/* SEARCH */}
                <div className="flex flex-1 items-center">
                    <div className="relative w-full max-w-[650px]">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                        <input
                            type="text"
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                            onFocus={() => setIsSearchOpen(true)}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') setIsSearchOpen(false);
                                if (event.key === 'Enter' && suggestions[0]) {
                                    event.preventDefault();
                                    selectProduct(suggestions[0]);
                                }
                            }}
                            aria-label="Tìm kiếm sản phẩm"
                            aria-expanded={isSearchOpen && normalizedSearch.length > 0}
                            aria-controls="product-search-suggestions"
                            autoComplete="off"
                            placeholder="Tìm kiếm sản phẩm..."
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        {isSearchOpen && normalizedSearch && (
                            <div
                                id="product-search-suggestions"
                                role="listbox"
                                className="absolute left-0 right-0 top-full z-[60] mt-2 max-h-[min(70vh,420px)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-xl"
                            >
                                {suggestions.length > 0 ? (
                                    suggestions.map((product) => (
                                        <button
                                            key={product._id}
                                            type="button"
                                            role="option"
                                            aria-selected="false"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => selectProduct(product)}
                                            className="flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                        >
                                            <span className="grid h-12 w-10 shrink-0 place-items-center overflow-hidden rounded bg-gray-100">
                                                {product.imagesProduct?.[0] && (
                                                    <img
                                                        className="h-full w-full object-contain"
                                                        src={product.imagesProduct[0]}
                                                        alt=""
                                                    />
                                                )}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-gray-800">
                                                    {product.nameProduct || 'Sản phẩm'}
                                                </span>
                                                <span className="mt-1 block text-xs font-medium text-[#2f604c]">
                                                    {formatPrice(
                                                        Number(product.priceProduct) *
                                                            (1 - (Number(product.discountProduct) || 0) / 100),
                                                    )}
                                                </span>
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="px-3 py-4 text-center text-sm text-gray-500">
                                        Không tìm thấy sản phẩm phù hợp.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {/* RIGHT */}
                <div className="flex items-center gap-5">
                    <Link to="/cart" className="header-cart" aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}>
                        <ShoppingBag size={23} />
                        <span>Giỏ hàng</span>
                        {cartCount > 0 && <b className="header-cart__count">{cartCount}</b>}
                    </Link>
                    {/* LOGIN */}
                    {dataUser && dataUser._id ? (
                        <div className="relative">
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                                aria-expanded={isMenuOpen}
                                onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
                            >
                                <UserCircle size={24} />
                                <span className="max-w-[130px] truncate font-medium">{userName}</span>
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                                    <div className="border-b border-gray-100 px-4 py-3">
                                        <p className="text-xs text-gray-500">Xin chào</p>
                                        <p className="truncate font-semibold text-gray-800">{userName}</p>
                                    </div>
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <User size={17} /> Hồ sơ cá nhân
                                    </Link>
                                    <Link
                                        to="/cart"
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <ShoppingBag size={17} /> Giỏ hàng
                                    </Link>
                                    <Link
                                        to="/my-orders"
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <ClipboardList size={17} /> Đơn hàng của tôi
                                    </Link>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={17} /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login">
                            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700">
                                <User size={18} />
                                <span>Đăng nhập</span>
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
