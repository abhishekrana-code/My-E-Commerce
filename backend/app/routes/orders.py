from flask import Blueprint, request, jsonify
from app.models.product import Product, CartItem
from app.models.order import Order, OrderItem
from app.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/', methods=['POST'])
@jwt_required()
def place_order():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    # Get user's cart items
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    if not cart_items:
        return jsonify({'message': 'Cart is empty'}), 400
        
    total_amount = 0
    order_items_to_create = []
    
    # Create order items and update product stock
    for item in cart_items:
        if item.product.stock < item.quantity:
            return jsonify({'message': f'Insufficient stock for {item.product.name}'}), 400
            
        total_amount += item.product.price * item.quantity
        
        # Deduct stock
        item.product.stock -= item.quantity
        
        order_item = OrderItem(
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_time=item.product.price
        )
        order_items_to_create.append(order_item)
        
    # Create the order with location data
    new_order = Order(
        user_id=user_id,
        total_amount=total_amount,
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        address=data.get('address'),
        items=order_items_to_create
    )
    
    db.session.add(new_order)
    
    # Clear cart
    for item in cart_items:
        db.session.delete(item)
        
    db.session.commit()
    return jsonify(new_order.to_dict()), 201

@orders_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_orders():
    user_id = int(get_jwt_identity())
    
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify([order.to_dict() for order in orders]), 200

@orders_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def get_all_orders():
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
        
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([order.to_dict() for order in orders]), 200

@orders_bp.route('/admin/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(id):
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
        
    order = Order.query.get_or_404(id)
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status in ['pending', 'shipped', 'delivered']:
        order.status = new_status
        db.session.commit()
        return jsonify(order.to_dict()), 200
    
    return jsonify({'message': 'Invalid status'}), 400
