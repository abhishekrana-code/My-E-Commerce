import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Product Form State
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', stock: '', image_url: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'products') {
        const res = await api.get('/products/');
        setProducts(res.data);
      } else if (activeTab === 'orders') {
        const res = await api.get('/orders/admin/all');
        setOrders(res.data);
      } else if (activeTab === 'users') {
        const res = await api.get('/auth/users');
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products/', formData);
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', category: '', stock: '', image_url: '' });
      fetchData();
    } catch (err) {
      alert("Action failed");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Delete this product?")) {
      await api.delete(`/products/${id}`);
      fetchData();
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    await api.put(`/orders/admin/${orderId}/status`, { status });
    fetchData();
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/auth/users/${userId}/status`, { is_active: !currentStatus });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) {
      try {
        await api.delete(`/auth/users/${userId}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || "Action failed");
      }
    }
  };

  return (
    <div className="home-container">
      <h2>Admin Dashboard</h2>
      
      <div className="admin-tabs">
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>Products</button>
        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>Orders</button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users</button>
      </div>

      <div className="admin-content">
        {activeTab === 'products' && (
          <section>
            <div className="admin-header">
              <h3>Inventory Management</h3>
              <button className="add-btn" onClick={() => {setShowProductForm(true); setEditingProduct(null);}}>Add New Product</button>
            </div>

            {showProductForm && (
              <form className="admin-form" onSubmit={handleProductSubmit}>
                <input placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <input placeholder="Price" type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                <input placeholder="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                <input placeholder="Stock" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                <input placeholder="Image URL" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                <button type="submit">{editingProduct ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowProductForm(false)}>Cancel</button>
              </form>
            )}

            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>₹{p.price}</td>
                    <td>{p.stock}</td>
                    <td>
                      <button onClick={() => {setEditingProduct(p); setFormData(p); setShowProductForm(true);}}>Edit</button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="remove-btn">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'orders' && (
          <section>
            <h3>All Customer Orders</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer ID</th>
                  <th>Total</th>
                  <th>Delivery Address</th>
                  <th>Map</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.user_id}</td>
                    <td>${o.total_amount.toFixed(2)}</td>
                    <td><div className="address-cell">{o.address}</div></td>
                    <td>
                      {o.latitude && o.longitude ? (
                        <a 
                          href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="map-link"
                        >
                          View on Map
                        </a>
                      ) : (
                        <span className="no-location">No GPS data</span>
                      )}
                    </td>
                    <td><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                    <td>
                      <select value={o.status} onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'users' && (
          <section>
            <h3>Registered Users</h3>
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <span className={`status-badge ${u.is_active ? 'delivered' : 'pending'}`}>
                        {u.is_active ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <>
                          <button 
                            className={u.is_active ? 'remove-btn' : 'add-btn'} 
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                            style={{ marginRight: '10px', minWidth: '80px' }}
                          >
                            {u.is_active ? 'Ban' : 'Unban'}
                          </button>
                          <button 
                            className="remove-btn" 
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
