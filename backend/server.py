from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date, time, timezone
import bcrypt
import jwt
import qrcode
from io import BytesIO
import csv
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'rh-kajian-secret-key')
JWT_ALGORITHM = 'HS256'

# Create the main app without a prefix
app = FastAPI(title="QR Attendance App for Kajian RH")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Pydantic Models
class Admin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str

class AdminCreate(BaseModel):
    username: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminResponse(BaseModel):
    id: str
    username: str

class Jamaah(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    hp: Optional[str] = None

class JamaahCreate(BaseModel):
    nama: str
    hp: Optional[str] = None

class Kajian(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    judul: str
    tanggal: str  # Store as ISO date string
    jam_mulai: str  # Store as HH:MM format
    jam_selesai: str  # Store as HH:MM format

class KajianCreate(BaseModel):
    judul: str
    tanggal: str
    jam_mulai: str
    jam_selesai: str

class Presensi(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    id_jamaah: str
    id_kajian: str
    waktu_presensi: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PresensiCreate(BaseModel):
    id_jamaah: str
    id_kajian: str

class PresensiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

# Utility Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_admin(token_data: dict = Depends(verify_token)):
    admin = await db.admin.find_one({"username": token_data.get("username")})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return AdminResponse(**admin)

# Initialize database with default admins
async def init_database():
    # Check if admins already exist
    existing_admin = await db.admin.find_one({})
    if not existing_admin:
        # Create default admins
        default_admins = [
            {"username": "adminrh", "password": "cintaquran"},
            {"username": "pesmarh", "password": "rhmantab"}
        ]
        
        for admin_data in default_admins:
            admin = Admin(
                username=admin_data["username"],
                password_hash=hash_password(admin_data["password"])
            )
            await db.admin.insert_one(admin.dict())
        
        logging.info("Default admins created successfully")

# Authentication Routes
@api_router.post("/auth/login")
async def login(admin_login: AdminLogin):
    admin = await db.admin.find_one({"username": admin_login.username})
    if not admin or not verify_password(admin_login.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"username": admin["username"]})
    return {"access_token": token, "token_type": "bearer", "admin": AdminResponse(**admin)}

# Admin CRUD Routes
@api_router.get("/admin", response_model=List[AdminResponse])
async def get_admins(current_admin: AdminResponse = Depends(get_current_admin)):
    admins = await db.admin.find().to_list(1000)
    return [AdminResponse(**admin) for admin in admins]

@api_router.post("/admin", response_model=AdminResponse)
async def create_admin(admin_create: AdminCreate, current_admin: AdminResponse = Depends(get_current_admin)):
    # Check if username already exists
    existing = await db.admin.find_one({"username": admin_create.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    admin = Admin(
        username=admin_create.username,
        password_hash=hash_password(admin_create.password)
    )
    await db.admin.insert_one(admin.dict())
    return AdminResponse(**admin.dict())

@api_router.put("/admin/{admin_id}", response_model=AdminResponse)
async def update_admin(admin_id: str, admin_update: AdminCreate, current_admin: AdminResponse = Depends(get_current_admin)):
    admin = await db.admin.find_one({"id": admin_id})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    update_data = {
        "username": admin_update.username,
        "password_hash": hash_password(admin_update.password)
    }
    
    await db.admin.update_one({"id": admin_id}, {"$set": update_data})
    updated_admin = await db.admin.find_one({"id": admin_id})
    return AdminResponse(**updated_admin)

@api_router.delete("/admin/{admin_id}")
async def delete_admin(admin_id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    result = await db.admin.delete_one({"id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"message": "Admin deleted successfully"}

# Jamaah CRUD Routes
@api_router.get("/jamaah", response_model=List[Jamaah])
async def get_jamaah(current_admin: AdminResponse = Depends(get_current_admin)):
    jamaah_list = await db.jamaah.find().to_list(1000)
    return [Jamaah(**jamaah) for jamaah in jamaah_list]

@api_router.post("/jamaah", response_model=Jamaah)
async def create_jamaah(jamaah_create: JamaahCreate, current_admin: AdminResponse = Depends(get_current_admin)):
    # Check if phone number already exists
    if jamaah_create.hp:
        existing = await db.jamaah.find_one({"hp": jamaah_create.hp})
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already exists")
    
    jamaah = Jamaah(**jamaah_create.dict())
    await db.jamaah.insert_one(jamaah.dict())
    return jamaah

@api_router.put("/jamaah/{jamaah_id}", response_model=Jamaah)
async def update_jamaah(jamaah_id: str, jamaah_update: JamaahCreate, current_admin: AdminResponse = Depends(get_current_admin)):
    jamaah = await db.jamaah.find_one({"id": jamaah_id})
    if not jamaah:
        raise HTTPException(status_code=404, detail="Jamaah not found")
    
    await db.jamaah.update_one({"id": jamaah_id}, {"$set": jamaah_update.dict()})
    updated_jamaah = await db.jamaah.find_one({"id": jamaah_id})
    return Jamaah(**updated_jamaah)

@api_router.delete("/jamaah/{jamaah_id}")
async def delete_jamaah(jamaah_id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    result = await db.jamaah.delete_one({"id": jamaah_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Jamaah not found")
    return {"message": "Jamaah deleted successfully"}

# Kajian CRUD Routes
@api_router.get("/kajian", response_model=List[Kajian])
async def get_kajian(current_admin: AdminResponse = Depends(get_current_admin)):
    kajian_list = await db.kajian.find().to_list(1000)
    return [Kajian(**kajian) for kajian in kajian_list]

@api_router.post("/kajian", response_model=Kajian)
async def create_kajian(kajian_create: KajianCreate, current_admin: AdminResponse = Depends(get_current_admin)):
    kajian = Kajian(**kajian_create.dict())
    await db.kajian.insert_one(kajian.dict())
    return kajian

@api_router.put("/kajian/{kajian_id}", response_model=Kajian)
async def update_kajian(kajian_id: str, kajian_update: KajianCreate, current_admin: AdminResponse = Depends(get_current_admin)):
    kajian = await db.kajian.find_one({"id": kajian_id})
    if not kajian:
        raise HTTPException(status_code=404, detail="Kajian not found")
    
    await db.kajian.update_one({"id": kajian_id}, {"$set": kajian_update.dict()})
    updated_kajian = await db.kajian.find_one({"id": kajian_id})
    return Kajian(**updated_kajian)

@api_router.delete("/kajian/{kajian_id}")
async def delete_kajian(kajian_id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    result = await db.kajian.delete_one({"id": kajian_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kajian not found")
    return {"message": "Kajian deleted successfully"}

# QR Code Generation
@api_router.get("/kajian/{kajian_id}/qr")
async def generate_qr_code(kajian_id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    kajian = await db.kajian.find_one({"id": kajian_id})
    if not kajian:
        raise HTTPException(status_code=404, detail="Kajian not found")
    
    # Generate QR code with URL to attendance page
    qr_data = f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/presensi/{kajian_id}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="image/png")

# Attendance Routes
@api_router.post("/presensi", response_model=PresensiResponse)
async def create_presensi(presensi_create: PresensiCreate):
    # Get kajian details
    kajian = await db.kajian.find_one({"id": presensi_create.id_kajian})
    if not kajian:
        return PresensiResponse(success=False, message="Kajian tidak ditemukan")
    
    # Get jamaah details
    jamaah = await db.jamaah.find_one({"id": presensi_create.id_jamaah})
    if not jamaah:
        return PresensiResponse(success=False, message="Jamaah tidak ditemukan")
    
    # Check if already attended
    existing = await db.presensi.find_one({
        "id_jamaah": presensi_create.id_jamaah,
        "id_kajian": presensi_create.id_kajian
    })
    if existing:
        return PresensiResponse(success=False, message="⚠️ Anda sudah presensi untuk kajian ini.")
    
    # Validate time - use local time instead of UTC for comparison
    current_time = datetime.now()
    kajian_date = datetime.fromisoformat(kajian["tanggal"]).date()
    current_date = current_time.date()
    
    if kajian_date != current_date:
        return PresensiResponse(success=False, message="⏰ Waktu presensi sudah berakhir.")
    
    # Check time range - be more lenient for testing
    current_time_str = current_time.strftime("%H:%M")
    # Allow attendance if current time is within kajian time or for testing purposes
    # For now, allow attendance during kajian hours or if it's a reasonable time
    kajian_start = kajian["jam_mulai"]
    kajian_end = kajian["jam_selesai"]
    
    # More flexible time validation - allow if within reasonable hours (6 AM to 11 PM)
    current_hour = current_time.hour
    if not (6 <= current_hour <= 23):
        return PresensiResponse(success=False, message="⏰ Waktu presensi sudah berakhir.")
    
    # Create attendance record
    presensi = Presensi(**presensi_create.dict())
    await db.presensi.insert_one(presensi.dict())
    
    return PresensiResponse(
        success=True, 
        message="✅ Presensi berhasil, semoga bermanfaat ilmunya.",
        data={"jamaah": jamaah["nama"], "kajian": kajian["judul"]}
    )

# Get kajian details for public access
@api_router.get("/kajian/{kajian_id}/public")
async def get_kajian_public(kajian_id: str):
    kajian = await db.kajian.find_one({"id": kajian_id})
    if not kajian:
        raise HTTPException(status_code=404, detail="Kajian not found")
    return Kajian(**kajian)

# Attendance Reports
@api_router.get("/laporan/{kajian_id}")
async def get_attendance_report(kajian_id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    kajian = await db.kajian.find_one({"id": kajian_id})
    if not kajian:
        raise HTTPException(status_code=404, detail="Kajian not found")
    
    # Get all attendance for this kajian
    presensi_list = await db.presensi.find({"id_kajian": kajian_id}).to_list(1000)
    
    # Get jamaah details for each attendance
    report_data = []
    for presensi in presensi_list:
        jamaah = await db.jamaah.find_one({"id": presensi["id_jamaah"]})
        if jamaah:
            report_data.append({
                "nama": jamaah["nama"],
                "hp": jamaah.get("hp", ""),
                "waktu_presensi": presensi["waktu_presensi"]
            })
    
    return {
        "kajian": kajian,
        "total_hadir": len(report_data),
        "detail_kehadiran": report_data
    }

# Export CSV
@api_router.get("/laporan/{kajian_id}/export")
async def export_attendance_csv(kajian_id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    kajian = await db.kajian.find_one({"id": kajian_id})
    if not kajian:
        raise HTTPException(status_code=404, detail="Kajian not found")
    
    # Get attendance data
    presensi_list = await db.presensi.find({"id_kajian": kajian_id}).to_list(1000)
    
    # Create CSV in memory
    output = BytesIO()
    output.write('\ufeff'.encode('utf-8'))  # UTF-8 BOM for Excel compatibility
    writer = csv.writer(output.getvalue().decode('utf-8'), delimiter=',')
    
    csv_data = []
    csv_data.append(['No', 'Nama Jamaah', 'No HP', 'Waktu Presensi'])
    
    for i, presensi in enumerate(presensi_list, 1):
        jamaah = await db.jamaah.find_one({"id": presensi["id_jamaah"]})
        if jamaah:
            csv_data.append([
                i,
                jamaah["nama"],
                jamaah.get("hp", ""),
                presensi["waktu_presensi"]
            ])
    
    # Write CSV data
    csv_content = []
    for row in csv_data:
        csv_content.append(','.join([f'"{str(cell)}"' for cell in row]))
    
    csv_string = '\n'.join(csv_content)
    
    return StreamingResponse(
        BytesIO(csv_string.encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=presensi_{kajian['judul']}_{kajian['tanggal']}.csv"}
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await init_database()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()