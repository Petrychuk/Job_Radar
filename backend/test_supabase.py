#!/usr/bin/env python3
import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def test_supabase_connection():
    database_url = os.environ.get('DATABASE_URL')
    
    print("="*60)
    print("Testing Supabase PostgreSQL Connection")
    print("="*60)
    print(f"Database URL: {database_url[:50]}...")
    
    try:
        print("\n1. Creating connection...")
        conn = await asyncpg.connect(database_url)
        print("✅ Connection successful!")
        
        print("\n2. Testing query...")
        version = await conn.fetchval('SELECT version()')
        print(f"✅ PostgreSQL version: {version[:80]}...")
        
        print("\n3. Listing tables...")
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        if tables:
            print(f"✅ Found {len(tables)} tables:")
            for table in tables:
                print(f"   - {table['table_name']}")
        else:
            print("⚠️  No tables found. Database is empty.")
        
        print("\n4. Testing write operation...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS test_connection (
                id SERIAL PRIMARY KEY,
                test_data TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await conn.execute("""
            INSERT INTO test_connection (test_data) VALUES ($1)
        """, "Job Radar migration test")
        print("✅ Write successful!")
        
        print("\n5. Testing read operation...")
        result = await conn.fetchrow("SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 1")
        print(f"✅ Read successful! Data: {result['test_data']}")
        
        print("\n6. Cleanup...")
        await conn.execute("DROP TABLE IF EXISTS test_connection")
        print("✅ Cleanup complete!")
        
        await conn.close()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED! Supabase is ready to use.")
        print("="*60)
        return True
        
    except Exception as e:
        print(f"\n❌ Connection failed!")
        print(f"Error: {type(e).__name__}")
        print(f"Details: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_supabase_connection())
    exit(0 if success else 1)
