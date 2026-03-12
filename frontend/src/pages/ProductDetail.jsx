import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!user || !token) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/cart/', { product_id: product.id, quantity: 1 });
      alert('Product added to cart!');
    } catch (err) {
      console.error('Add to cart error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.msg || 'Failed to add product to cart. Please check if you are logged in.';
      alert(errorMessage);
    }
  };

  if (loading) return <div className="loading">Loading product details...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="home-container">
      <div className="product-detail-layout">
        <img src={product.image_url} alt={product.name} className="detail-img" />
        <div className="detail-info">
          <h2>{product.name}</h2>
          <p className="category">{product.category}</p>
          <p className="price">${product.price.toFixed(2)}</p>
          <p className="description">{product.description}</p>
          <p className="stock">Stock: {product.stock}</p>
          <button 
            className="add-btn" 
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
