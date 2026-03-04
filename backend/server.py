from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthCredential
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
from passlib.context import CryptContext
from jose import JWTError, jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

MOCK_LEVELS = [
    {"id": "nivel-0", "name": "Nivel 0 - Desde Cero", "order": 0, "description": "Conceptos básicos de bases de datos", "locked": False},
    {"id": "basico", "name": "Básico", "order": 1, "description": "SELECT, WHERE, ORDER BY", "locked": False},
    {"id": "medio", "name": "Medio", "order": 2, "description": "JOINs, GROUP BY, subconsultas", "locked": False},
    {"id": "avanzado", "name": "Avanzado", "order": 3, "description": "Índices, transacciones, optimización", "locked": False},
    {"id": "pro", "name": "Pro", "order": 4, "description": "Arquitectura, escalabilidad, clustering", "locked": False}
]

MOCK_EXERCISES = {
    "nivel-0": [
        {
            "id": "ex-0-1",
            "title": "Tu primera consulta",
            "description": "Selecciona todos los datos de la tabla 'usuarios'",
            "difficulty": "beginner",
            "type": "drag_drop",
            "wordBank": ["SELECT", "*", "FROM", "usuarios", "WHERE", "ORDER BY"],
            "expectedQuery": "SELECT * FROM usuarios",
            "hint": "Recuerda: primero SELECT, luego los campos, después FROM y el nombre de la tabla"
        }
    ],
    "basico": [
        {
            "id": "ex-b-1",
            "title": "Filtrar con WHERE",
            "description": "Selecciona usuarios mayores de 18 años",
            "difficulty": "beginner",
            "type": "drag_drop",
            "wordBank": ["SELECT", "*", "FROM", "usuarios", "WHERE", "edad", ">", "18"],
            "expectedQuery": "SELECT * FROM usuarios WHERE edad > 18",
            "hint": "Usa WHERE para filtrar condiciones"
        }
    ],
    "medio": [
        {
            "id": "ex-m-1",
            "title": "INNER JOIN",
            "description": "Une las tablas usuarios y pedidos",
            "difficulty": "advanced",
            "type": "code_editor",
            "starterCode": "-- Escribe tu consulta aquí\nSELECT \nFROM \n",
            "hint": "Usa INNER JOIN ON para unir tablas"
        }
    ],
    "avanzado": [
        {
            "id": "ex-a-1",
            "title": "Optimización con índices",
            "description": "Crea un índice para mejorar el rendimiento",
            "difficulty": "advanced",
            "type": "code_editor",
            "starterCode": "-- Crea un índice aquí\nCREATE INDEX \nON \n",
            "hint": "CREATE INDEX nombre_indice ON tabla(columna)"
        }
    ],
    "pro": [
        {
            "id": "ex-p-1",
            "title": "Transacciones complejas",
            "description": "Implementa una transacción ACID",
            "difficulty": "advanced",
            "type": "code_editor",
            "starterCode": "-- Implementa la transacción\nBEGIN;\n\nCOMMIT;\n",
            "hint": "Recuerda manejar ROLLBACK en caso de error"
        }
    ]
}

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    xp: int
    streak: int
    level: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class ChatMessage(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

class ExerciseValidation(BaseModel):
    exercise_id: str
    query: str
    level_id: str

class ValidationResult(BaseModel):
    success: bool
    message: str
    xp_gained: int = 0

def create_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION)
    payload = {
        "user_id": user_id,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthCredential = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    user_id = str(uuid.uuid4())
    hashed_password = pwd_context.hash(user_data.password)
    
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "xp": 0,
        "streak": 0,
        "level": "nivel-0",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    token = create_token(user_id)
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        xp=user["xp"],
        streak=user["streak"],
        level=user["level"]
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not pwd_context.verify(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_token(user["id"])
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        xp=user["xp"],
        streak=user["streak"],
        level=user["level"]
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.get("/user/profile", response_model=UserResponse)
async def get_profile(current_user = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        xp=current_user["xp"],
        streak=current_user["streak"],
        level=current_user["level"]
    )

@api_router.get("/levels")
async def get_levels():
    return {"levels": MOCK_LEVELS}

@api_router.get("/exercises/{level_id}")
async def get_exercises(level_id: str):
    exercises = MOCK_EXERCISES.get(level_id, [])
    return {"exercises": exercises}

@api_router.post("/exercises/validate", response_model=ValidationResult)
async def validate_exercise(validation: ExerciseValidation, current_user = Depends(get_current_user)):
    level_exercises = MOCK_EXERCISES.get(validation.level_id, [])
    exercise = next((ex for ex in level_exercises if ex["id"] == validation.exercise_id), None)
    
    if not exercise:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    
    query_normalized = validation.query.strip().replace("\n", " ").upper()
    
    if exercise.get("type") == "drag_drop":
        expected_normalized = exercise["expectedQuery"].strip().replace("\n", " ").upper()
        success = query_normalized == expected_normalized
    else:
        success = "SELECT" in query_normalized or "CREATE" in query_normalized or "BEGIN" in query_normalized
    
    xp_gained = 10 if success else 0
    
    if success and xp_gained > 0:
        new_xp = current_user["xp"] + xp_gained
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"xp": new_xp}}
        )
    
    return ValidationResult(
        success=success,
        message="¡Correcto! Dagon está orgulloso 🔴" if success else "No es correcto. Intenta de nuevo",
        xp_gained=xp_gained
    )

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_clawbot(chat_data: ChatMessage):
    try:
        emergent_key = os.environ.get('EMERGENT_LLM_KEY')
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=chat_data.session_id,
            system_message="Eres Clawbot, un tutor experto en SQL y PostgreSQL. Tu misión es ayudar a estudiantes a aprender SQL de manera clara y práctica. Eres amigable, paciente y das ejemplos concretos. Hablas en español."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=chat_data.message)
        response = await chat.send_message(user_message)
        
        return ChatResponse(
            response=response,
            session_id=chat_data.session_id
        )
    except Exception as e:
        logging.error(f"Error en chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en el chat: {str(e)}")

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