from backend.app import create_app
from backend.app.extensions import db
from sqlalchemy import text

def fix():
    app = create_app()
    with app.app_context():
        print("Starting Manual Database Column Injection...")
        
        # List of columns to check/add
        alter_queries = [
            "ALTER TABLE orders ADD COLUMN latitude FLOAT AFTER status;",
            "ALTER TABLE orders ADD COLUMN longitude FLOAT AFTER latitude;",
            "ALTER TABLE orders MODIFY COLUMN address TEXT;"
        ]
        
        for query in alter_queries:
            try:
                print(f"Executing: {query}")
                db.session.execute(text(query))
                db.session.commit()
                print("Successfully added/modified column.")
            except Exception as e:
                if "Duplicate column name" in str(e):
                    print("Column already exists, skipping.")
                else:
                    print(f"Error executing query: {e}")
                    db.session.rollback()
        
        print("\nDatabase should now be up to date!")

if __name__ == "__main__":
    fix()
