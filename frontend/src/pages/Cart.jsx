import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({ lat: null, lng: null, address: '' });
  const [locationLoading, setLocationLoading] = useState(false);
  const { user, refreshCartCount } = useContext(AuthContext);
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
    if (newQuantity < 1) return;
    try {
      await api.put(`/cart/${id}`, { quantity: newQuantity });
      await fetchCart();
      await refreshCartCount();
    } catch (err) {
      alert('Failed to update quantity');
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      await fetchCart();
      await refreshCartCount();
    } catch (err) {
      alert('Failed to remove item');
    }
  };
  const getAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      return data.display_name || '';
    } catch (err) {
      console.error('Error fetching address:', err);
      return '';
    }
  };
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await getAddressFromCoords(latitude, longitude);
        setLocation({
          lat: latitude,
          lng: longitude,
          address: address || location.address
        });
        setLocationLoading(false);
      },
      (err) => {
        console.error(err);
        alert('Unable to retrieve location');
        setLocationLoading(false);
      }
    );
  };

  const handlePlaceOrder = async () => {
    if (!location.lat || !location.lng || !location.address) {
      alert('Please provide your location and delivery address');
      return;
    }

    try {
      await api.post('/orders/', {
        latitude: location.lat,
        longitude: location.lng,
        address: location.address
      });
      await refreshCartCount();
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
            
            <div className="location-section">
              <h3>Delivery Details</h3>
              <div className="location-picker">
                <button 
                  onClick={handleFetchLocation} 
                  className="location-btn"
                  disabled={locationLoading}
                >
                  {locationLoading ? 'Fetching...' : 'Get My Live Location'}
                </button>
                {location.lat && (
                  <p className="location-status success">Location Captured! ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</p>
                )}
              </div>
              <textarea
                placeholder="Enter full delivery address"
                value={location.address}
                onChange={(e) => setLocation({ ...location, address: e.target.value })}
                className="address-input"
              />
            </div>
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
