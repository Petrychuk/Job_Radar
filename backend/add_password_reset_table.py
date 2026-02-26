import psycopg2
import os

# Add password reset tokens table
sql = """
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
"""

try:
    # Read DATABASE_URL from .env
    with open('.env', 'r') as f:
        for line in f:
            if line.startswith('DATABASE_URL='):
                database_url = line.split('=', 1)[1].strip()
                break
    
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute(sql)
    print("✅ Password reset tokens table created successfully!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ Error: {e}")
