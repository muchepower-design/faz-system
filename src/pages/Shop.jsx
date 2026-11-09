import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { shopAPI } from '../api';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaStar, FaBolt } from 'react-icons/fa';

const Shop = () => {
  const navigate = useNavigate();
  const { addToCart, refreshCart, cartCount } = useCart(); // Add cartCount and refreshCart
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        shopAPI.getCategories(),
        shopAPI.getProducts(selectedCategory ? { category_id: selectedCategory } : {})
      ]);
      setCategories(categoriesRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId, buyNow = false) => {
    const success = await addToCart(productId, 1, buyNow);
    if (success) {
      // Force a refresh of the cart to update the navbar count
      await refreshCart();
      if (!buyNow) {
        alert('Product added to cart!');
      } else {
        navigate('/cart');
      }
    } else {
      alert('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="pt-24 text-center">
        <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold gradient-text">Official FAZ Shop</h1>
          <Link to="/cart" className="relative">
            <div className="glass p-3 rounded-full hover:bg-white/10 transition">
              <FaShoppingCart className="text-2xl" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-faz-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
          </Link>
        </div>
        
        {/* Categories */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`glass p-4 text-center hover:scale-105 transition ${!selectedCategory ? 'bg-faz-green/20' : ''}`}
          >
            <div className="text-3xl mb-1">🛍️</div>
            <h3 className="font-semibold">All Products</h3>
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`glass p-4 text-center hover:scale-105 transition ${selectedCategory === cat.id ? 'bg-faz-green/20' : ''}`}
            >
              {/*
              <div className="text-3xl mb-1">{cat.icon || '📦'}</div>
              */}
              <h3 className="font-semibold">{cat.display_name}</h3>
            </button>
          ))}
        </div>
        
        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {products.map(product => (
            <GlassCard key={product.id} className="overflow-hidden p-0 hover:scale-105 transition duration-300 group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={product.image_url || 'https://via.placeholder.com/400x300?text=Product'} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
                {product.compare_price && product.compare_price > product.price && (
                  <span className="absolute top-2 right-2 bg-faz-red text-white text-xs px-2 py-1 rounded-full">SALE</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-faz-orange font-bold">ZMW {product.price}</span>
                  {product.compare_price && (
                    <span className="text-gray-400 line-through text-sm">ZMW {product.compare_price}</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">{product.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddToCart(product.id, false)}
                    className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2"
                    disabled={product.stock_quantity === 0}
                  >
                    <FaShoppingCart /> {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                  {product.stock_quantity > 0 && (
                    <button
                      onClick={() => handleAddToCart(product.id, true)}
                      className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-2"
                    >
                      <FaBolt /> Buy Now
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
        
        {products.length === 0 && (
          <GlassCard className="text-center py-8 text-gray-400">
            No products found in this category.
          </GlassCard>
        )}
        
        {/* Physical Store Info */}
        <GlassCard>
          <h2 className="text-2xl font-bold mb-2">Physical Stores</h2>
          <p className="text-gray-300">Visit our official outlet in Lusaka, at Football House, along Alick Nkhata Road, next to KK Mall.</p>
          <div className="mt-3 flex gap-4">
            <Link to="/shop/locations" className="text-faz-orange hover:underline">View Locations →</Link>
            <Link to="/cart" className="text-faz-green hover:underline">View Cart →</Link>
          </div>
        </GlassCard>
      </div>
      <Footer />
    </>
  );
};

export default Shop;