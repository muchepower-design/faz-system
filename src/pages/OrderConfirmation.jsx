import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { shopAPI } from '../api';
import { FaCheckCircle } from 'react-icons/fa';

const OrderConfirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await shopAPI.getOrder(id);
      setOrder(res.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
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
        <GlassCard className="max-w-2xl mx-auto text-center py-12">
          <FaCheckCircle className="text-6xl text-faz-green mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-4">Order Confirmed!</h1>
          <p className="text-gray-300 mb-4">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          <p className="text-gray-400 mb-6">
            Order Number: <span className="text-faz-orange font-mono">{order?.order_number}</span>
          </p>
          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-gray-400 text-sm">
              A confirmation email has been sent to your email address.
            </p>
          </div>
          <Link to="/shop" className="btn-primary inline-block mt-6">
            Continue Shopping
          </Link>
        </GlassCard>
      </div>
      <Footer />
    </>
  );
};

export default OrderConfirmation;