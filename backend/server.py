from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
security = HTTPBearer()

class Shop(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_name: str
    city: str
    state: str
    zip: str = ""
    address: str = ""
    phone: str = ""
    email: str = ""
    styles: List[str] = []
    price_range: str = "$$"
    avg_rating: float = 0.0
    review_count: int = 0
    description: str = ""
    images: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShopUpdate(BaseModel):
    description: Optional[str] = None
    styles: Optional[List[str]] = None
    price_range: Optional[str] = None
    images: Optional[List[str]] = None

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_id: str
    reviewer_name: str
    rating: int
    comment: str
    images: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    shop_id: str
    reviewer_name: str
    rating: int
    comment: str
    images: List[str] = []

class Artist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    shop_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ArtistCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    shop_id: str

class ArtistLogin(BaseModel):
    email: EmailStr
    password: str

def create_token(artist_id: str, email: str) -> str:
    payload = {
        'artist_id': artist_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.get("/")
async def root():
    return {"message": "Tattoo Directory API"}

@api_router.get("/shops", response_model=List[Shop])
async def get_shops(
    city: Optional[str] = None,
    state: Optional[str] = None,
    style: Optional[str] = None,
    price_range: Optional[str] = None,
    min_rating: Optional[float] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    if state:
        query['state'] = state
    if style:
        query['styles'] = style
    if price_range:
        query['price_range'] = price_range
    if min_rating:
        query['avg_rating'] = {'$gte': min_rating}
    if search:
        query['$or'] = [
            {'shop_name': {'$regex': search, '$options': 'i'}},
            {'city': {'$regex': search, '$options': 'i'}}
        ]
    
    shops = await db.shops.find(query, {"_id": 0}).limit(limit).to_list(limit)
    for shop in shops:
        if isinstance(shop.get('created_at'), str):
            shop['created_at'] = datetime.fromisoformat(shop['created_at'])
    return shops

@api_router.get("/shops/{shop_id}", response_model=Shop)
async def get_shop(shop_id: str):
    shop = await db.shops.find_one({'id': shop_id}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    if isinstance(shop.get('created_at'), str):
        shop['created_at'] = datetime.fromisoformat(shop['created_at'])
    return shop

@api_router.get("/shops/{shop_id}/reviews", response_model=List[Review])
async def get_shop_reviews(shop_id: str):
    reviews = await db.reviews.find({'shop_id': shop_id}, {"_id": 0}).to_list(100)
    for review in reviews:
        if isinstance(review.get('created_at'), str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
    return reviews

@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate):
    shop = await db.shops.find_one({'id': review_data.shop_id}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    review = Review(**review_data.model_dump())
    doc = review.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.reviews.insert_one(doc)
    
    reviews = await db.reviews.find({'shop_id': review_data.shop_id}, {"_id": 0}).to_list(1000)
    if reviews:
        avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
        await db.shops.update_one(
            {'id': review_data.shop_id},
            {'$set': {'avg_rating': round(avg_rating, 1), 'review_count': len(reviews)}}
        )
    
    return review

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    image_url = f"data:{file.content_type};base64,{base64_image}"
    return {"image_url": image_url}

@api_router.post("/artists/register")
async def register_artist(artist_data: ArtistCreate):
    existing = await db.artists.find_one({'email': artist_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Artist already exists")
    
    shop = await db.shops.find_one({'id': artist_data.shop_id}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    hashed_password = bcrypt.hashpw(artist_data.password.encode('utf-8'), bcrypt.gensalt())
    artist = Artist(
        email=artist_data.email,
        name=artist_data.name,
        shop_id=artist_data.shop_id
    )
    doc = artist.model_dump()
    doc['password'] = hashed_password.decode('utf-8')
    doc['created_at'] = doc['created_at'].isoformat()
    await db.artists.insert_one(doc)
    
    token = create_token(artist.id, artist.email)
    return {"token": token, "artist": artist}

@api_router.post("/artists/login")
async def login_artist(login_data: ArtistLogin):
    artist = await db.artists.find_one({'email': login_data.email}, {"_id": 0})
    if not artist:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(login_data.password.encode('utf-8'), artist['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(artist['id'], artist['email'])
    artist.pop('password')
    if isinstance(artist.get('created_at'), str):
        artist['created_at'] = datetime.fromisoformat(artist['created_at'])
    return {"token": token, "artist": artist}

@api_router.get("/artists/me")
async def get_current_artist(payload: dict = Depends(verify_token)):
    artist = await db.artists.find_one({'id': payload['artist_id']}, {"_id": 0, "password": 0})
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    if isinstance(artist.get('created_at'), str):
        artist['created_at'] = datetime.fromisoformat(artist['created_at'])
    return artist

@api_router.get("/artists/shop")
async def get_artist_shop(payload: dict = Depends(verify_token)):
    artist = await db.artists.find_one({'id': payload['artist_id']}, {"_id": 0})
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    shop = await db.shops.find_one({'id': artist['shop_id']}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    if isinstance(shop.get('created_at'), str):
        shop['created_at'] = datetime.fromisoformat(shop['created_at'])
    return shop

@api_router.put("/shops/{shop_id}")
async def update_shop(shop_id: str, update_data: ShopUpdate, payload: dict = Depends(verify_token)):
    artist = await db.artists.find_one({'id': payload['artist_id']}, {"_id": 0})
    if not artist or artist['shop_id'] != shop_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this shop")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        await db.shops.update_one({'id': shop_id}, {'$set': update_dict})
    
    shop = await db.shops.find_one({'id': shop_id}, {"_id": 0})
    if isinstance(shop.get('created_at'), str):
        shop['created_at'] = datetime.fromisoformat(shop['created_at'])
    return shop

@api_router.get("/cities")
async def get_cities():
    cities = await db.shops.distinct('city')
    return sorted([c for c in cities if c])

@api_router.get("/states")
async def get_states():
    states = await db.shops.distinct('state')
    return sorted([s for s in states if s])

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()