import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { shopAPI } from '../api';
import { useCart } from '../context/CartContext';
import { FaTrash, FaArrowLeft, FaCreditCard, FaSpinner, FaShoppingCart } from 'react-icons/fa';

// Import provider logos
import airtelLogo from './assets/momo/logos/momo_airtel.png';
import mtnLogo from './assets/momo/logos/momo_mtn.png';
import zamtelLogo from './assets/momo/logos/momo_zamtel.jpg';

const providerLogos = {
  'MTN_MOMO_ZMB': mtnLogo,
  'AIRTEL_OAPI_ZMB': airtelLogo,
  'ZAMTEL_ZMB': zamtelLogo,
};

const providerNames = {
  'MTN_MOMO_ZMB': 'MTN Mobile Money',
  'AIRTEL_OAPI_ZMB': 'Airtel Money',
  'ZAMTEL_ZMB': 'Zamtel Kwacha',
};

const sanitizeErrorMessage = (message) => {
  if (!message) return '';
  let sanitized = message;
  for (const [code, name] of Object.entries(providerNames)) {
    sanitized = sanitized.replace(new RegExp(code, 'g'), name);
    const shortCode = code.replace('_ZMB', '').replace('_OAPI_ZMB', '');
    if (shortCode !== code) {
      sanitized = sanitized.replace(new RegExp(shortCode, 'g'), name);
    }
  }
  return sanitized;
};

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, cartSubtotal, loading, updateQuantity, removeItem, refreshCart } = useCart();
  const [checkoutData, setCheckoutData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: ''
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [depositId, setDepositId] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [cart, setCart] = useState({ items: [], subtotal: 0, total: 0 });

  useEffect(() => {
    fetchCartData();
    fetchProviders();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) {
      setCheckoutData(prev => ({ ...prev, customer_name: user.name, customer_email: user.email }));
    }
  }, []);

  const fetchCartData = async () => {
    try {
      const res = await shopAPI.getCart();
      setCart(res.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await shopAPI.getPaymentProviders();
      setProviders(res.data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (window.pollingInterval) clearInterval(window.pollingInterval);
    };
  }, []);

  const handlePhoneChange = (e) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 10) input = input.slice(0, 10);
    if (input.length > 0 && input[0] !== '0') return;
    setPhoneNumber(input);
  };

  const startPolling = (depId, ordId) => {
    setDepositId(depId);
    setOrderId(ordId);
    setPaymentStatus('WAITING');
    setPollingActive(true);
    
    window.pollingInterval = setInterval(async () => {
      try {
        const res = await shopAPI.checkPaymentStatus(depId);
        const data = res.data;
        
        if (data.status === 'COMPLETED') {
          clearInterval(window.pollingInterval);
          setPaymentStatus('COMPLETED');
          setPollingActive(false);
          alert('Payment successful! Your order has been confirmed.');
          navigate(`/shop/confirmation/${ordId}`);
        } else if (data.status === 'FAILED') {
          clearInterval(window.pollingInterval);
          setPaymentStatus('FAILED');
          setPollingActive(false);
          const message = data.failureReason?.failureMessage || 'Payment failed. Please try again.';
          alert(sanitizeErrorMessage(message));
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);
    
    setTimeout(() => {
      if (window.pollingInterval) {
        clearInterval(window.pollingInterval);
        if (paymentStatus === 'WAITING') {
          setPaymentStatus('TIMEOUT');
          setPollingActive(false);
        }
      }
    }, 120000);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setProcessingPayment(true);
    
    const isValidPhone = /^0\d{9}$/.test(phoneNumber);
    if (!selectedProvider) {
      alert('Please select a mobile money provider');
      setProcessingPayment(false);
      return;
    }
    if (!isValidPhone) {
      alert('Please enter a valid 10-digit phone number starting with 0 (e.g., 0977123456)');
      setProcessingPayment(false);
      return;
    }
    
    // Send raw phone number (with leading 0) - let backend format it
    const rawPhoneNumber = phoneNumber;
    
    try {
      const orderRes = await shopAPI.checkout(checkoutData);
      const newOrderId = orderRes.data.order_id;
      
      const paymentRes = await shopAPI.initiatePayment({
        order_id: newOrderId,
        provider: selectedProvider,
        phone_number: rawPhoneNumber
      });
      
      if (paymentRes.data.success) {
        alert('Payment request sent. Please check your phone to approve.');
        startPolling(paymentRes.data.depositId, newOrderId);
      } else {
        const reason = paymentRes.data.failureReason;
        if (reason) {
          const code = reason.failureCode;
          const msg = reason.failureMessage;
          if (code === 'INVALID_PHONE_NUMBER') {
            alert('Invalid phone number. Please check and try again.');
          } else if (code === 'AMOUNT_OUT_OF_BOUNDS') {
            alert('Amount is outside allowed limits.');
          } else if (code === 'PROVIDER_TEMPORARILY_UNAVAILABLE') {
            alert('Provider is temporarily unavailable. Try again later.');
          } else {
            alert(sanitizeErrorMessage(msg || 'Payment failed. Please try again.'));
          }
        } else {
          alert('Payment failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 text-center">
        <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (cart.items?.length === 0 && !showCheckout) {
    return (
      <>
        <div className="pt-24 min-h-screen container mx-auto px-6">
          <GlassCard className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link to="/shop" className="btn-primary inline-block">Continue Shopping</Link>
          </GlassCard>
        </div>
        <Footer />
      </>
    );
  }

  if (paymentStatus === 'WAITING') {
    return (
      <>
        <div className="pt-24 min-h-screen container mx-auto px-6">
          <GlassCard className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 border-4 border-faz-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold gradient-text mb-4">Waiting for Payment</h2>
            <p className="text-gray-300 mb-2">
              Please check your mobile phone and enter your Mobile Money PIN to approve the payment.
            </p>
            <p className="text-gray-400 text-sm">Waiting for confirmation...</p>
          </GlassCard>
        </div>
        <Footer />
      </>
    );
  }

  if (showCheckout) {
    return (
      <>
        <div className="pt-24 min-h-screen container mx-auto px-6">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setShowCheckout(false)} className="text-faz-orange hover:text-faz-green inline-flex items-center gap-2">
              <FaArrowLeft /> Back to Cart
            </button>
            <Link to="/cart" className="relative">
              <div className="glass p-2 rounded-full hover:bg-white/10 transition">
                <FaShoppingCart />
                {cart.items?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-faz-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
            </Link>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-6">Checkout</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            <GlassCard>
              <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {cart.items?.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b border-white/10 pb-2">
                    <div>
                      <p className="font-semibold">{item.product_name}</p>
                      <p className="text-sm text-gray-400">Qty: {item.quantity} × ZMW {item.unit_price}</p>
                    </div>
                    <p className="font-bold">ZMW {item.subtotal}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/20 pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="gradient-text">ZMW {cart.total}</span>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard>
              <h2 className="text-2xl font-bold mb-4">Payment Details</h2>
              <form onSubmit={handleCheckout} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={checkoutData.customer_name}
                  onChange={(e) => setCheckoutData({...checkoutData, customer_name: e.target.value})}
                  className="glass w-full p-3 rounded"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={checkoutData.customer_email}
                  onChange={(e) => setCheckoutData({...checkoutData, customer_email: e.target.value})}
                  className="glass w-full p-3 rounded"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g., 0977123456)"
                  value={checkoutData.customer_phone}
                  onChange={(e) => setCheckoutData({...checkoutData, customer_phone: e.target.value})}
                  className="glass w-full p-3 rounded"
                  required
                />
                <textarea
                  placeholder="Shipping Address"
                  rows="3"
                  value={checkoutData.shipping_address}
                  onChange={(e) => setCheckoutData({...checkoutData, shipping_address: e.target.value})}
                  className="glass w-full p-3 rounded"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium mb-2">Select Mobile Money Provider</label>
                  <div className="grid grid-cols-3 gap-3">
                    {providers.map(prov => (
                      <button
                        key={prov.provider}
                        type="button"
                        disabled={!prov.deposit_operational}
                        onClick={() => setSelectedProvider(prov.provider)}
                        className={`p-3 border-2 rounded-xl flex flex-col items-center gap-2 transition ${
                          !prov.deposit_operational
                            ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50'
                            : selectedProvider === prov.provider
                              ? 'border-faz-orange bg-faz-orange/10'
                              : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <img
                          src={providerLogos[prov.provider]}
                          alt={providerNames[prov.provider]}
                          className="h-8 w-auto object-contain"
                        />
                        <span className="text-xs font-medium">
                          {providerNames[prov.provider]}
                        </span>
                        {!prov.deposit_operational && (
                          <span className="text-xs text-faz-red">Unavailable</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Mobile Money Phone Number</label>
                  <input
                    type="tel"
                    placeholder="0xxxxxxxxx (10 digits)"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    className="glass w-full p-3 rounded"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Enter your 10-digit mobile number starting with 0 (e.g., 0977123456)
                  </p>
                </div>
                
                <button 
                  type="submit" 
                  disabled={processingPayment || !selectedProvider || !/^0\d{9}$/.test(phoneNumber)} 
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingPayment ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <><FaCreditCard /> Pay ZMW {cart.total}</>
                  )}
                </button>
              </form>
              <p className="text-xs text-gray-400 mt-4 text-center">
                You will receive a payment prompt on your mobile phone. Please approve to complete payment.
              </p>
            </GlassCard>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold gradient-text">Shopping Cart</h1>
          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative">
              <div className="glass p-2 rounded-full hover:bg-white/10 transition">
                <FaShoppingCart />
                {cart.items?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-faz-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items?.map(item => (
              <GlassCard key={item.id} className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.product_image || 'https://via.placeholder.com/80x80?text=Product'} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold">{item.product_name}</h3>
                    <p className="text-sm text-gray-400">
                      {item.size && `Size: ${item.size} | `}
                      {item.color && `Color: ${item.color}`}
                    </p>
                    <p className="text-faz-orange font-bold">ZMW {item.unit_price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="glass w-8 h-8 rounded-full hover:bg-white/20"
                    >-</button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="glass w-8 h-8 rounded-full hover:bg-white/20"
                    >+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-faz-red hover:text-faz-red/70">
                    <FaTrash />
                  </button>
                  <p className="font-bold min-w-[80px] text-right">ZMW {item.subtotal}</p>
                </div>
              </GlassCard>
            ))}
          </div>
          
          <div>
            <GlassCard>
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 border-b border-white/10 pb-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>ZMW {cart.subtotal}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Delivery</span>
                  <span>Free</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3">
                <span>Total</span>
                <span className="gradient-text">ZMW {cart.total}</span>
              </div>
              <button onClick={() => setShowCheckout(true)} className="btn-primary w-full mt-6 py-3">
                Proceed to Checkout
              </button>
              <Link to="/shop" className="block text-center text-faz-orange mt-4 hover:underline">
                Continue Shopping
              </Link>
            </GlassCard>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Cart;