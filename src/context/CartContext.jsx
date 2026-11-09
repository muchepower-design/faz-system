import React, { createContext, useState, useContext, useEffect } from 'react';
import { shopAPI } from '../api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await shopAPI.getCart();
      const items = res.data.items || [];
      const subtotal = res.data.subtotal || 0;
      const total = res.data.total || 0;
      setCartItems(items);
      setCartSubtotal(subtotal);
      const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalCount);
      
      // Dispatch event for navbar to listen (for components not using context)
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: totalCount, items, subtotal, total } }));
      return { items, subtotal, total };
    } catch (error) {
      console.error('Error fetching cart:', error);
      return { items: [], subtotal: 0, total: 0 };
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1, buyNow = false) => {
    try {
      await shopAPI.addToCart({ product_id: productId, quantity });
      // Wait a moment for the server to process
      setTimeout(() => {
        fetchCart();
      }, 100);
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await shopAPI.updateCartItem(itemId, quantity);
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await shopAPI.removeCartItem(itemId);
      await fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const clearCart = async () => {
    for (const item of cartItems) {
      await shopAPI.removeCartItem(item.id);
    }
    await fetchCart();
  };

  useEffect(() => {
    fetchCart();
    
    // Listen for storage events (for cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'cart_updated') {
        fetchCart();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <CartContext.Provider value={{
      cartCount,
      cartItems,
      cartSubtotal,
      loading,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart: fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};