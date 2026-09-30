import { useEffect, useState } from 'react';
import Context from './Context';
import { requestAuth } from '../config/UserRequest';

import cookie from 'js-cookie';
//import { requestGetCart } from '../config/CartRequest';

export function Provider({ children }) {
    const [dataUser, setDataUser] = useState(null);
    const [cartItems, setCartItems] = useState([]);

    const token = cookie.get('logged');
    const cartKey = dataUser?._id ? `cart:${dataUser._id}` : null;

    const readCart = (key) => {
        if (!key) return [];
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch {
            return [];
        }
    };

    const refreshAuth = async () => {
        try {
            const res = await requestAuth();
            setDataUser(res.metadata);
            return res.metadata;
        } catch (error) {
            setDataUser(null);
            throw error;
        }
    };

    useEffect(() => {
        if (token) {
            requestAuth()
                .then((res) => setDataUser(res.metadata))
                .catch(() => setDataUser(null));
        }
    }, [token]);

    useEffect(() => {
        if (cartKey && !localStorage.getItem(cartKey)) {
            const legacyCart = localStorage.getItem('cart');
            if (legacyCart) {
                localStorage.setItem(cartKey, legacyCart);
                localStorage.removeItem('cart');
            }
        }

        setCartItems(readCart(cartKey));

        const syncCart = () => {
            setCartItems(readCart(cartKey));
        };

        window.addEventListener('storage', syncCart);
        window.addEventListener('cart-updated', syncCart);
        return () => {
            window.removeEventListener('storage', syncCart);
            window.removeEventListener('cart-updated', syncCart);
        };
    }, [cartKey]);

    const addToCart = (product, quantity = 1) => {
        if (!cartKey) return;
        const existingItem = cartItems.find((item) => item._id === product._id);
        const nextCart = existingItem
            ? cartItems.map((item) =>
                  item._id === product._id
                      ? { ...item, quantity: item.quantity + quantity, stockProduct: product.stockProduct }
                      : item,
              )
            : [...cartItems, { ...product, quantity }];

        localStorage.setItem(cartKey, JSON.stringify(nextCart));
        setCartItems(nextCart);
        window.dispatchEvent(new Event('cart-updated'));
    };

    const updateCartQuantity = (productId, quantity) => {
        if (!cartKey) return;
        const nextCart = cartItems
            .map((item) => (item._id === productId ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0);
        localStorage.setItem(cartKey, JSON.stringify(nextCart));
        setCartItems(nextCart);
        window.dispatchEvent(new Event('cart-updated'));
    };

    const removeFromCart = (productId) => updateCartQuantity(productId, 0);
    const clearCart = () => {
        if (!cartKey) return;
        localStorage.setItem(cartKey, '[]');
        setCartItems([]);
        window.dispatchEvent(new Event('cart-updated'));
    };
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    return (
        <Context.Provider
            value={{
                dataUser,
                setDataUser,
                refreshAuth,
                cartItems,
                cartCount,
                addToCart,
                updateCartQuantity,
                removeFromCart,
                clearCart,
            }}
        >
            {children}
        </Context.Provider>
    );
}
