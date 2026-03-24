from flask import Blueprint, request, jsonify
from app.models.user import User
from app.models.product import Product, CartItem
from app.models.order import Order, OrderItem
from app.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/', methods=['POST'])
@jwt_required()
def place_order():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        # 1. Fetch Cart Items
        cart_items = CartItem.query.filter_by(user_id=user_id).all()
        if not cart_items:
            return jsonify({'message': 'Cart is empty'}), 400
            
        total_amount = 0.0
        
        # 2. Create Order Object
        # Cast location to float only if they exist, otherwise use None
        lat = data.get('latitude')
        lng = data.get('longitude')
        
        new_order = Order(
            user_id=user_id,
            total_amount=0.0, # Will update after calculating
            latitude=float(lat) if lat is not None else None,
            longitude=float(lng) if lng is not None else None,
            address=str(data.get('address', 'No address provided'))[:500]
        )
        db.session.add(new_order)
        
        # 3. Process Items
        for item in cart_items:
            if not item.product:
                continue
                
            if item.product.stock < item.quantity:
                db.session.rollback()
                return jsonify({'message': f'Insufficient stock for {item.product.name}'}), 400
            
            # Update product stock
            item.product.stock -= item.quantity
            item_price = float(item.product.price)
            total_amount += (item_price * item.quantity)
            
            # Create OrderItem
            order_item = OrderItem(
                order=new_order,
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_time=item_price
            )
            db.session.add(order_item)
            
            # Remove from cart
            db.session.delete(item)
            
        new_order.total_amount = total_amount
        
        # 4. Commit everything
        db.session.commit()
        
        return jsonify({
            'message': 'Order placed successfully!',
            'order_id': new_order.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc() # This prints the REAL error to your terminal
        return jsonify({
            'message': 'Internal Server Error',
            'error': str(e)
        }), 500

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
