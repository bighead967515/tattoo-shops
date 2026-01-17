import asyncio
import csv
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

STYLE_OPTIONS = [
    'Traditional', 'Neo-Traditional', 'Japanese', 'Blackwork', 
    'Realism', 'Watercolor', 'Tribal', 'Geometric', 'Fine Line',
    'Portraits', 'Cover-ups', 'Script'
]

PRICE_RANGES = ['$', '$$', '$$$', '$$$$']

async def import_shops():
    csv_path = '/app/usa_tattoo_parlors_final.csv'
    
    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        return
    
    await db.shops.delete_many({})
    print("Cleared existing shops")
    
    shops = []
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            shop_name = row.get('Shop_Name', '').strip()
            city = row.get('City', '').strip()
            state = row.get('State', '').strip()
            
            if not shop_name or not city or not state:
                continue
            
            import random
            styles = random.sample(STYLE_OPTIONS, random.randint(2, 4))
            price_range = random.choice(PRICE_RANGES)
            
            shop = {
                'id': str(uuid.uuid4()),
                'shop_name': shop_name,
                'city': city,
                'state': state,
                'zip': row.get('Zip', '').strip(),
                'address': row.get('Address', '').strip(),
                'phone': row.get('Phone', '').strip(),
                'email': row.get('Email', '').strip(),
                'styles': styles,
                'price_range': price_range,
                'avg_rating': 0.0,
                'review_count': 0,
                'description': '',
                'images': [],
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            shops.append(shop)
    
    if shops:
        await db.shops.insert_many(shops)
        print(f"Imported {len(shops)} shops successfully")
    else:
        print("No shops to import")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(import_shops())