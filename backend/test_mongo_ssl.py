#!/usr/bin/env python3
import asyncio
import ssl
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import certifi

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def test_with_custom_ssl():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    # Parse the URL to extract credentials and host
    url_without_params = mongo_url.split('?')[0]
    
    print(f"Testing MongoDB connection with custom SSL context...")
    print(f"DB Name: {db_name}")
    print(f"URL: {url_without_params[:60]}...")
    print(f"Certifi CA Bundle: {certifi.where()}")
    
    # Try different SSL configurations
    configs = [
        {
            "name": "Default with tlsInsecure",
            "uri": f"{url_without_params}?retryWrites=true&w=majority&tlsInsecure=true",
            "extra": {}
        },
        {
            "name": "With certifi CA file",
            "uri": f"{url_without_params}?retryWrites=true&w=majority",
            "extra": {"tlsCAFile": certifi.where()}
        },
        {
            "name": "TLS 1.2 minimum",
            "uri": f"{url_without_params}?retryWrites=true&w=majority&tls=true",
            "extra": {}
        },
        {
            "name": "Disable cert verification",
            "uri": f"{url_without_params}?retryWrites=true&w=majority&tlsAllowInvalidCertificates=true",
            "extra": {}
        }
    ]
    
    for config in configs:
        print(f"\n{'='*60}")
        print(f"Trying: {config['name']}")
        print(f"{'='*60}")
        
        try:
            client = AsyncIOMotorClient(
                config['uri'],
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                **config['extra']
            )
            
            print("Attempting to ping...")
            await client.admin.command('ping')
            print(f"✅ SUCCESS with {config['name']}!")
            
            # Test database access
            db = client[db_name]
            collections = await db.list_collection_names()
            print(f"Collections: {collections if collections else 'None yet'}")
            
            client.close()
            return True
            
        except Exception as e:
            print(f"❌ Failed with {config['name']}")
            print(f"Error: {str(e)[:200]}")
            try:
                client.close()
            except:
                pass
    
    print("\n" + "="*60)
    print("All connection attempts failed!")
    print("="*60)
    return False

if __name__ == "__main__":
    asyncio.run(test_with_custom_ssl())
