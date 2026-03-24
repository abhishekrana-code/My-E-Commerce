import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/');
        setOrders(response.data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (loading) return <div className="loading">Loading your orders...</div>;

  return (
    <div className="home-container">
      <h2>My Order History</h2>
      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <span className="order-id">Order ID: #{order.id}</span>
                  <span className="order-date">Date: {new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <span className={`status-badge ${order.status}`}>{order.status.toUpperCase()}</span>
              </div>
              
              <div className="order-items-summary">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item-row">
                    <span>{item.product_name} x {item.quantity}</span>
                    <span>${(item.price_at_time * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <p className="order-address"><strong>Delivery Address:</strong> {order.address}</p>
                <p className="order-total"><strong>Total Amount:</strong> ${order.total_amount.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
