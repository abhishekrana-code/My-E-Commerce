from app import create_app
from app.extensions import db
from sqlalchemy import text

def fix():
    app = create_app()
    with app.app_context():
        print("Starting Manual Database Column Injection...")
        
        queries = [
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS latitude FLOAT AFTER status;",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS longitude FLOAT AFTER latitude;",
        ]
        
        for query in queries:
            try:
                db.session.execute(text(query))
                db.session.commit()
                print(f"Executed: {query}")
            except Exception as e:
                db.session.rollback()
                
                if "check the manual" in str(e).lower():
                    try:
                        col = "latitude" if "latitude" in query else "longitude"
                        db.session.execute(text(f"ALTER TABLE orders ADD COLUMN {col} FLOAT;"))
                        db.session.commit()
                        print(f"Added {col} manually.")
                    except:
                        db.session.rollback()

        # Handle User is_active specifically
        try:
            print("Trying to add is_active column to users...")
            db.session.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;"))
            db.session.commit()
            print("Successfully added is_active column to users.")
        except Exception as e:
            db.session.rollback()
            if "Duplicate column name" in str(e):
                print("is_active column already exists in users table.")
            else:
                print(f"Error handling is_active: {e}")

        # Handle Address specifically
        try:
            print("Trying to add address column...")
            db.session.execute(text("ALTER TABLE orders ADD COLUMN address TEXT;"))
            db.session.commit()
            print("Successfully added address column.")
        except Exception as e:
            db.session.rollback()
            if "Duplicate column name" in str(e):
                print("Address column exists, ensuring it is TEXT...")
                db.session.execute(text("ALTER TABLE orders MODIFY COLUMN address TEXT;"))
                db.session.commit()
                print("Modified address column to TEXT.")
            else:
                print(f"Error handling address: {e}")
        
        print("\nDatabase columns check complete!")

if __name__ == "__main__":
    fix()
