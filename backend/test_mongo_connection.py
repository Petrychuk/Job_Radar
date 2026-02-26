#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def test_connection():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    print(f"Testing MongoDB connection...")
    print(f"DB Name: {db_name}")
    print(f"URL: {mongo_url[:50]}...")
    
    try:
        # Connect with explicit SSL settings
        client = AsyncIOMotorClient(
            mongo_url,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
        )
        
        # Test the connection
        print("\nAttempting to ping database...")
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        
        # List databases
        print("\nListing databases...")
        dbs = await client.list_database_names()
        print(f"Available databases: {dbs}")
        
        # Test access to our database
        db = client[db_name]
        collections = await db.list_collection_names()
        print(f"\nCollections in '{db_name}': {collections if collections else 'No collections yet'}")
        
        # Test write operation
        print("\nTesting write operation...")
        test_collection = db['test_connection']
        result = await test_collection.insert_one({"test": "connection", "timestamp": "2024"})
        print(f"✅ Write successful! Inserted ID: {result.inserted_id}")
        
        # Test read operation
        print("\nTesting read operation...")
        doc = await test_collection.find_one({"test": "connection"})
        print(f"✅ Read successful! Document: {doc}")
        
        # Cleanup
        await test_collection.delete_one({"test": "connection"})
        print("\n✅ All tests passed! MongoDB is properly connected.")
        
        client.close()
        
    except Exception as e:
        print(f"\n❌ Connection failed!")
        print(f"Error: {type(e).__name__}")
        print(f"Details: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
