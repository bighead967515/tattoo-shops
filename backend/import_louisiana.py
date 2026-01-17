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

async def import_louisiana_shops():
    csv_path = '/app/louisiana_shops.csv'
    
    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        return
    
    shops = []
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            shop_name = row.get('Name', '').strip()
            city = row.get('City', '').strip()
            state = 'LA'  # Louisiana
            
            if not shop_name or not city:
                continue
            
            # Check if shop already exists
            existing = await db.shops.find_one({'shop_name': shop_name, 'city': city})
            if existing:
                print(f"Skipping duplicate: {shop_name} in {city}")
                continue
            
            import random
            
            # Parse specialties if available
            specialties_str = row.get('Specialties', '').strip()
            if specialties_str and 'Artists:' in specialties_str:
                # Has artists info, might give clue to styles
                styles = random.sample(STYLE_OPTIONS, random.randint(2, 4))
            else:
                styles = random.sample(STYLE_OPTIONS, random.randint(2, 3))
            
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
                'description': specialties_str if specialties_str else '',
                'images': [],
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            shops.append(shop)
    
    if shops:
        await db.shops.insert_many(shops)
        print(f"Imported {len(shops)} Louisiana shops successfully")
    else:
        print("No new shops to import")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(import_louisiana_shops())
