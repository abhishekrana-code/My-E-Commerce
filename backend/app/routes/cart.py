from flask import Blueprint, request, jsonify
from app.models.product import Product, CartItem
from app.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/', methods=['GET'])
@jwt_required()
def get_cart():
    user_identity = get_jwt_identity()
    user_id = user_identity['id']
    
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    return jsonify([item.to_dict() for item in cart_items]), 200

@cart_bp.route('/', methods=['POST'])
@jwt_required()
def add_to_cart():
    user_identity = get_jwt_identity()
    user_id = user_identity['id']
    data = request.get_json()
    
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    # Check if product exists and has stock
    product = Product.query.get_or_404(product_id)
    if product.stock < quantity:
        return jsonify({'message': 'Insufficient stock'}), 400
        
    # Check if item already in cart
    cart_item = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
    
    if cart_item:
        cart_item.quantity += quantity
    else:
        cart_item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
        db.session.add(cart_item)
        
    db.session.commit()
    return jsonify(cart_item.to_dict()), 201

@cart_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_cart_quantity(id):
    user_identity = get_jwt_identity()
    user_id = user_identity['id']
    data = request.get_json()
    new_quantity = data.get('quantity')
    
    cart_item = CartItem.query.get_or_404(id)
    
    if cart_item.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    if new_quantity <= 0:
        db.session.delete(cart_item)
    else:
        cart_item.quantity = new_quantity
        
    db.session.commit()
    return jsonify({'message': 'Cart updated'}), 200

@cart_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(id):
    user_identity = get_jwt_identity()
    user_id = user_identity['id']
    
    cart_item = CartItem.query.get_or_404(id)
    
    if cart_item.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    db.session.delete(cart_item)
    db.session.commit()
    return jsonify({'message': 'Item removed from cart'}), 200
