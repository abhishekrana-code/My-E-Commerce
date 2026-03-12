import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchCart = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/cart/');
      setCartItems(response.data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchCart();
    }
  }, [user]);

  const handleUpdateQuantity = async (id, newQuantity) => {
    try {
      await api.put(`/cart/${id}`, { quantity: newQuantity });
      fetchCart();
    } catch (err) {
      alert('Failed to update quantity');
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      fetchCart();
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      await api.post('/orders/');
      alert('Order placed successfully!');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  if (loading) return <div className="loading">Loading cart...</div>;

  return (
    <div className="home-container">
      <h2>Your Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="cart-container">
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.product.image_url} alt={item.product.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <h3>{item.product.name}</h3>
                  <p className="price">${item.product.price.toFixed(2)}</p>
                  <div className="quantity-controls">
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <button onClick={() => handleRemove(item.id)} className="remove-btn">Remove</button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <p>Total Items: {cartItems.length}</p>
            <p className="total-price">Total: ${calculateTotal().toFixed(2)}</p>
            <button onClick={handlePlaceOrder} className="checkout-btn">Place Order</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
