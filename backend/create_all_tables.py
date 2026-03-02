#!/usr/bin/env python3
import psycopg2
import os

# Read DATABASE_URL from .env
database_url = None
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            database_url = line.split('=', 1)[1].strip()
            break

if not database_url:
    print("❌ DATABASE_URL not found in .env")
    exit(1)

print("="*60)
print("Creating ALL tables in new database")
print("="*60)
print(f"Database: {database_url[:50]}...")

try:
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Main schema from schema.sql
    print("\n1. Creating main tables from schema.sql...")
    with open('schema.sql', 'r') as f:
        cursor.execute(f.read())
    print("✅ Main tables created")
    
    # 2. Add profile_name to resumes
    print("\n2. Adding profile_name column to resumes...")
    cursor.execute("""
        ALTER TABLE resumes 
        ADD COLUMN IF NOT EXISTS profile_name VARCHAR(255) DEFAULT 'Main Resume';
        
        CREATE INDEX IF NOT EXISTS idx_resumes_profile_name ON resumes(profile_name);
    """)
    print("✅ profile_name added")
    
    # 3. Password reset tokens table
    print("\n3. Creating password_reset_tokens table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    """)
    print("✅ password_reset_tokens created")
    
    # 4. Hidden jobs table
    print("\n4. Creating hidden_jobs table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hidden_jobs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            source VARCHAR(255),
            url TEXT,
            hidden_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_hidden_jobs_user_id ON hidden_jobs(user_id);
        CREATE INDEX IF NOT EXISTS idx_hidden_jobs_title ON hidden_jobs(title);
    """)
    print("✅ hidden_jobs created")
    
    # List all tables
    print("\n5. Verifying tables...")
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
    print("✅ ALL TABLES CREATED SUCCESSFULLY!")
    print("="*60)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
