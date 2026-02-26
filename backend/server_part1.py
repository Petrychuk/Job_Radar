from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query, Depends
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os, logging, uuid, json, asyncio, re, resend
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup
import requests as http_requests
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
from passlib.context import CryptContext
from jose import jwt, JWTError
import asyncpg
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

db_pool: Optional[asyncpg.Pool] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL not set")
    db_pool = await asyncpg.create_pool(database_url, min_size=2, max_size=10, command_timeout=60)
    logger.info("Database pool created")
    yield
    if db_pool:
        await db_pool.close()

app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

UPLOAD_DIR = Path("/tmp/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
EXPORT_DIR = Path("/tmp/exports")
EXPORT_DIR.mkdir(exist_ok=True)

LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret_key')
JWT_ALGORITHM = "HS256"

resend.api_key = RESEND_API_KEY
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Auth helpers
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["sub"]
        async with db_pool.acquire() as conn:
            user = await conn.fetchrow("SELECT * FROM users WHERE id = $1", uuid.UUID(user_id))
            if user:
                return dict(user)
        return None
    except (JWTError, ValueError):
        return None

async def require_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# Продолжение следует в файле - слишком длинный для генерации в Python heredoc
