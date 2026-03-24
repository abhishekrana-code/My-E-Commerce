from flask import Blueprint, request, jsonify
from app.models.user import User
from app.extensions import db, bcrypt, jwt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return User.query.filter_by(id=int(identity)).one_or_none()

@jwt.additional_claims_loader
def add_claims_to_access_token(identity):
    user = User.query.get(int(identity))
    return {"is_active": user.is_active if user else False}

@auth_bp.before_app_request
def check_banned_user():
    # Only check if token exists and identity is available
    from flask_jwt_extended import verify_jwt_in_request, get_current_user
    try:
        # Check if request has a valid token
        verify_jwt_in_request(optional=True)
        user = get_current_user()
        if user and not user.is_active:
            return jsonify({'message': 'Your account has been banned. Please contact support.'}), 403
    except:
        pass

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
        
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_pw,
        role=data.get('role', 'user')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        if not user.is_active:
            return jsonify({'message': 'Your account has been banned. Please contact support.'}), 403
            
        # Use a string identity (user id) for better stability
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'token': access_token,
            'user': user.to_dict()
        }), 200
        
    return jsonify({'message': 'Invalid credentials'}), 401

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    user_id = get_jwt_identity()
    current_user = User.query.get(int(user_id))
    
    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
        
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@auth_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    current_admin_id = get_jwt_identity()
    current_admin = User.query.get(int(current_admin_id))
    
    if not current_admin or current_admin.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    if user.id == current_admin.id:
        return jsonify({'message': 'Cannot ban yourself!'}), 400
        
    data = request.get_json()
    user.is_active = data.get('is_active', user.is_active)
    db.session.commit()
    return jsonify({'message': f"User status updated to {'Active' if user.is_active else 'Banned'}"}), 200

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_admin_id = get_jwt_identity()
    current_admin = User.query.get(int(current_admin_id))
    
    if not current_admin or current_admin.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    if user.id == current_admin.id:
        return jsonify({'message': 'Cannot delete yourself!'}), 400
        
    # Optional: Handle cascading deletes for orders or other records if needed
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200
