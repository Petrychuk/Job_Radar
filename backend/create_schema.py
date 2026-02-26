import psycopg2
from dotenv import load_dotenv
import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Read schema.sql
with open(ROOT_DIR / 'schema.sql', 'r') as f:
    schema_sql = f.read()

# Connect and create schema
try:
    print("="*60)
    print("Creating Database Schema on Supabase")
    print("="*60)
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("\nExecuting schema.sql...")
    cursor.execute(schema_sql)
    print("✅ Schema created successfully!")
    
    # Verify tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = cursor.fetchall()
    
    print(f"\n✅ Created {len(tables)} tables:")
    for table in tables:
        print(f"   - {table[0]}")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*60)
    print("✅ DATABASE READY!")
    print("="*60)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
