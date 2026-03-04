# Dagon - Plataforma Interactiva de Aprendizaje SQL

<div align="center">

![Dagon](https://img.shields.io/badge/Dagon-SQL%20Learning-DC2626?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4.5-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

Una plataforma educativa moderna e interactiva para aprender SQL y administración de bases de datos PostgreSQL.

</div>

## 🌊 Características Principales

### 🎓 Sistema de Aprendizaje Progresivo
- **5 Niveles de Dificultad**: Desde "Nivel 0 - Desde Cero" hasta "Pro"
- **Ejercicios Interactivos**: Drag & Drop para principiantes, Monaco Editor para avanzados
- **Sistema de XP y Rachas**: Gamificación para mantener la motivación

### 🤖 Clawbot - Tu Tutor IA
- Asistente inteligente con **GPT-5.2** vía Emergent LLM Key
- Responde preguntas sobre SQL en tiempo real
- Contexto conversacional persistente

### 🎨 Diseño "Abyss & Crimson"
- Tema oscuro inspirado en las profundidades oceánicas
- Mascota Dagon: pulpito rojo animado
- Efectos glassmorphism y glows neón

### ⚙️ Funcionalidades Técnicas
- **Autenticación JWT** con bcrypt
- **Editor Monaco** con resaltado SQL
- **Drag & Drop** con React Beautiful DnD
- **Validación de consultas** en tiempo real
- **Consola de resultados** con EXPLAIN ANALYZE

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 16+
- Python 3.11+
- MongoDB
- Yarn

### Instalación

```bash
# Backend
cd /app/backend
pip install -r requirements.txt

# Frontend
cd /app/frontend
yarn install
```

### Variables de Entorno

**Backend (.env)**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
JWT_SECRET=dagon_secret_key_abyss_2026
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
EMERGENT_LLM_KEY=sk-emergent-cC5F7BcBe42E751703
CORS_ORIGINS=*
```

**Frontend (.env)**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Ejecutar en Desarrollo

```bash
# Backend (puerto 8001)
cd /app/backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Frontend (puerto 3000)
cd /app/frontend
yarn start
```

Accede a: `http://localhost:3000`

## 📁 Estructura del Proyecto

```
/app
├── backend/
│   ├── server.py           # API FastAPI principal
│   ├── requirements.txt    # Dependencias Python
│   └── .env               # Variables de entorno
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DagonMascot.js      # SVG animado de la mascota
│   │   │   ├── Clawbot.js          # Chat IA tutor
│   │   │   └── ui/                 # Componentes Shadcn
│   │   ├── pages/
│   │   │   ├── LoginPage.js        # Autenticación
│   │   │   ├── DashboardPage.js    # Vista principal
│   │   │   └── ExercisePage.js     # Ejercicios (Drag&Drop + Editor)
│   │   ├── contexts/
│   │   │   └── AuthContext.js      # Gestión de autenticación
│   │   ├── services/
│   │   │   └── apiService.js       # Cliente API
│   │   ├── App.js                  # Router principal
│   │   └── index.css               # Estilos globales
│   ├── package.json
│   └── .env
└── design_guidelines.json  # Guías de diseño UX/UI
```

## 🎯 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión (devuelve JWT)
- `GET /api/user/profile` - Obtener perfil del usuario (requiere auth)

### Niveles y Ejercicios
- `GET /api/levels` - Listar todos los niveles
- `GET /api/exercises/:levelId` - Obtener ejercicios de un nivel
- `POST /api/exercises/validate` - Validar consulta SQL

### Clawbot (IA)
- `POST /api/chat` - Enviar mensaje al tutor IA

## 🎨 Paleta de Colores

```css
--background-default: #020617  /* Abyss Deep */
--background-paper: #0F172A    /* Ocean Surface */
--primary-main: #DC2626        /* Crimson Red */
--secondary-main: #06B6D4      /* Cyan Glow */
--text-primary: #F8FAFC        /* White */
--text-secondary: #94A3B8      /* Slate */
```

## 🔧 Tecnologías Utilizadas

### Backend
- **FastAPI** - Framework web moderno
- **Motor** - Driver async MongoDB
- **Passlib + Bcrypt** - Hashing de contraseñas
- **Python-JOSE** - Manejo de JWT
- **Emergent Integrations** - Integración LLM universal

### Frontend
- **React 19** - Biblioteca UI
- **React Router v7** - Navegación
- **Axios** - Cliente HTTP
- **Monaco Editor** - Editor de código (VS Code)
- **React Beautiful DnD** - Drag & Drop
- **Tailwind CSS** - Estilos utility-first
- **Shadcn/UI** - Componentes accesibles
- **Sonner** - Notificaciones toast
- **Lucide React** - Iconos

## 📚 Niveles Disponibles

| Nivel | Nombre | Tipo de Ejercicio | Contenido |
|-------|--------|-------------------|-----------|
| 0 | Nivel 0 - Desde Cero | Drag & Drop | Conceptos básicos de BD |
| 1 | Básico | Drag & Drop | SELECT, WHERE, ORDER BY |
| 2 | Medio | Code Editor | JOINs, GROUP BY, subconsultas |
| 3 | Avanzado | Code Editor | Índices, transacciones |
| 4 | Pro | Code Editor | Arquitectura, escalabilidad |

## 🤖 Integración Clawbot

Clawbot utiliza **Emergent LLM Key** (clave universal) que funciona con:
- OpenAI (GPT-5.2 - actual)
- Anthropic Claude
- Google Gemini

### Cambiar Backend del Chat

Para apuntar Clawbot a tu propio backend en Spring Boot:

1. Localiza `/app/frontend/src/services/apiService.js`
2. Modifica la función `chat()`:

```javascript
chat: async (message, sessionId) => {
  // Cambiar esta URL por tu backend Spring Boot
  const response = await axios.post('http://localhost:8080/api/chat', {
    message,
    session_id: sessionId
  });
  return response.data;
}
```

## 🐛 Problemas Conocidos

### Drag & Drop
- **Estado**: Funcional con correcciones aplicadas
- Si no funciona, verificar que `isDropDisabled={false}` esté en todos los `<Droppable>`

### Clawbot FAB
- **Z-index**: Configurado en 9999 para evitar overlays
- Si no se ve, verificar que no haya elementos con z-index mayor

### Preview URL
- La URL de preview pública puede tener problemas de routing
- Usar `http://localhost:3000` para desarrollo local

## 📝 Datos Mock

### Usuarios de Prueba
```javascript
Email: demo@dagon.com
Password: demo123
Nombre: Usuario Demo
```

### Ejercicios Mock
Los ejercicios están definidos en `backend/server.py` en `MOCK_EXERCISES`.
Puedes modificarlos directamente o conectar a tu base de datos PostgreSQL.

## 🔒 Seguridad

- Contraseñas hasheadas con **bcrypt**
- Tokens JWT con expiración de 24h
- CORS configurado (ajustar en producción)
- Variables sensibles en `.env`

## 🚀 Despliegue

### Consideraciones
1. Cambiar `JWT_SECRET` a un valor seguro
2. Configurar `CORS_ORIGINS` con dominios específicos
3. Usar variables de entorno para `MONGO_URL`
4. Configurar proxy inverso (Nginx) para producción

### Spring Boot Backend
Cuando tu backend en Java esté listo:
1. Actualizar `REACT_APP_BACKEND_URL` en frontend/.env
2. Modificar `apiService.js` si la estructura de respuesta difiere
3. Asegurarte de que los endpoints coincidan (/api/chat, /api/evaluar, etc.)

## 🎓 Próximos Pasos Sugeridos

1. ✅ **Agregar más ejercicios** - Ampliar el banco de ejercicios por nivel
2. ✅ **Conectar PostgreSQL real** - Reemplazar datos mock con BD real
3. ✅ **Sistema de logros** - Badges y certificados
4. ✅ **Leaderboard** - Clasificación de usuarios
5. ✅ **Modo oscuro/claro** - Opción de tema (actualmente solo oscuro)
6. ✅ **Soporte multiidioma** - i18n (actualmente solo español)

## 📄 Licencia

Este proyecto fue creado como MVP educativo. Usa las guías de diseño y arquitectura libremente.

## 💡 Créditos

- **Diseño**: Inspirado en Jujutsu Kaisen (Dagon)
- **Stack**: React + FastAPI + MongoDB
- **IA**: Emergent LLM Key (GPT-5.2)
- **Componentes**: Shadcn/UI
- **Editor**: Monaco Editor (VS Code)

---

<div align="center">

**Desarrollado con 🔴 por la comunidad de Emergent**

¿Preguntas? Abre un issue o contacta al soporte.

</div>
