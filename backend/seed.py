from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.product import Product

def seed_database():
    app = create_app()
    with app.app_context():
        # 1. Create Tables
        print("Creating database tables...")
        db.create_all()

        # 2. Create Demo Admin
        if not User.query.filter_by(email='admin@example.com').first():
            print("Creating demo admin...")
            admin = User(
                username='admin',
                email='admin@example.com',
                password_hash=bcrypt.generate_password_hash('admin123').decode('utf-8'),
                role='admin'
            )
            db.session.add(admin)

        # 3. Create Demo User
        if not User.query.filter_by(email='user@example.com').first():
            print("Creating demo user...")
            user = User(
                username='johndoe',
                email='user@example.com',
                password_hash=bcrypt.generate_password_hash('user123').decode('utf-8'),
                role='user'
            )
            db.session.add(user)

        # 4. Create Demo Products
        if Product.query.count() == 0:
            print("Adding demo products...")
            products = [
                Product(
                    name='Pro Gaming Laptop',
                    description='High-performance laptop with RTX 4080 and 32GB RAM.',
                    price=2499.99,
                    category='Electronics',
                    stock=10,
                    image_url='https://images.unsplash.com/photo-1603302576837-37561b2e2302'
                ),
                Product(
                    name='Wireless Noise Cancelling Headphones',
                    description='Premium sound quality with 40-hour battery life.',
                    price=299.99,
                    category='Electronics',
                    stock=25,
                    image_url='https://images.unsplash.com/photo-1505740420928-5e560c06d30e'
                ),
                Product(
                    name='Classic Cotton T-Shirt',
                    description='100% organic cotton, breathable and stylish.',
                    price=24.99,
                    category='Fashion',
                    stock=100,
                    image_url='https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
                ),
                Product(
                    name='Smart Watch Series X',
                    description='Track your fitness, sleep, and heart rate in real-time.',
                    price=399.99,
                    category='Electronics',
                    stock=15,
                    image_url='https://images.unsplash.com/photo-1523275335684-37898b6baf30'
                ),
                Product(
                    name='Automatic Espresso Machine',
                    description='Barista-quality coffee at the touch of a button.',
                    price=899.00,
                    category='Home',
                    stock=5,
                    image_url='https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6'
                )
            ]
            db.session.bulk_save_objects(products)
        
        db.session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
