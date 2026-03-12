import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products/');
        setProducts(response.data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/cart/', { product_id: product.id, quantity: 1 });
      alert(`${product.name} added to cart!`);
    } catch (err) {
      console.error('Add to cart error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.msg || 'Failed to add product to cart. Please check if you are logged in.';
      alert(errorMessage);
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="home-container">
      <h2>Products</h2>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.image_url} alt={product.name} />
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="price">${product.price.toFixed(2)}</p>
              <p className="category">{product.category}</p>
              <div className="btn-group">
                <Link to={`/product/${product.id}`} className="view-btn">View Details</Link>
                <button 
                  className="add-btn" 
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock <= 0}
                >
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
