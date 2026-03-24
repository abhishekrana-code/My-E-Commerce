import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { user, refreshCartCount } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products/');
        setProducts(response.data);
        setFilteredProducts(response.data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const categories = [...new Set(products.map(p => p.category))];

  const handleAddToCart = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/cart/', { product_id: product.id, quantity: 1 });
      await refreshCartCount();
      // Replacing alert with a more user-friendly notification could be next
      alert(`${product.name} added to cart!`);
    } catch (err) {
      console.error('Add to cart error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.msg || 'Failed to add product to cart.';
      alert(errorMessage);
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="home-container">
      <div className="home-header">
        <h2>Explore Our Products</h2>
        <div className="filter-controls">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="product-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image_url} alt={product.name} />
              <div className="product-info">
                <span className="product-category-tag">{product.category}</span>
                <h3>{product.name}</h3>
                <p className="price">Rs. {product.price}</p>
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
          ))
        ) : (
          <div className="no-results">No products found matching your criteria.</div>
        )}
      </div>
    </div>
  );
};

export default Home;
