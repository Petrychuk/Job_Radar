import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Fetch variables
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

print("="*60)
print("Testing Supabase Connection (psycopg2)")
print("="*60)
print(f"Host: {HOST}")
print(f"Port: {PORT}")
print(f"Database: {DBNAME}")
print(f"User: {USER}")

# Connect to the database
try:
    print("\nConnecting...")
    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME,
        connect_timeout=10
    )
    print("✅ Connection successful!")
    
    # Create a cursor to execute SQL queries
    cursor = connection.cursor()
    
    # Example query
    cursor.execute("SELECT NOW();")
    result = cursor.fetchone()
    print(f"✅ Current Time: {result[0]}")

    # Test table listing
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = cursor.fetchall()
    if tables:
        print(f"\n✅ Found {len(tables)} tables:")
        for table in tables:
            print(f"   - {table[0]}")
    else:
        print("\n⚠️  No tables found. Database is empty.")

    # Close the cursor and connection
    cursor.close()
    connection.close()
    print("\n✅ Connection closed.")
    print("="*60)
    print("SUCCESS! Supabase is working!")
    print("="*60)

except Exception as e:
    print(f"\n❌ Failed to connect: {e}")
    import traceback
    traceback.print_exc()
