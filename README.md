# Medical Translator - Doctor-Patient Communication Platform

A production-grade, real-time translation platform enabling seamless multilingual communication between healthcare providers and patients.

## 🎯 Project Overview

This application solves the critical problem of language barriers in healthcare settings by providing:
- **Real-time bidirectional translation** between doctors and patients
- **Audio recording and transcription** for complete conversation capture
- **AI-powered medical summaries** extracting key clinical information
- **Searchable conversation history** with context highlighting
- **Production-ready deployment** on Vercel with full backend API

## ✨ Key Features

### Core Functionalities (All Implemented)
1. ✅ **Real-Time Translation** - Instant translation between 100+ languages for both roles
2. ✅ **Clean Chat Interface** - Medical-grade UI with clear role distinction
3. ✅ **Audio Recording** - Browser-based recording with playback in conversation thread
4. ✅ **Conversation Logging** - Persistent history with timestamps beyond sessions
5. ✅ **Advanced Search** - Full-text search with context highlighting
6. ✅ **AI Medical Summary** - Automated extraction of symptoms, diagnoses, medications

### Technical Highlights
- **Full-stack TypeScript** for type safety and maintainability
- **Claude AI Integration** for medical summarization
- **Google Cloud Translation API** for accurate real-time translation
- **PostgreSQL + Prisma** for robust data persistence
- **Socket.IO** for real-time bidirectional communication
- **Responsive Design** optimized for tablets and desktops
- **Production Security** with JWT auth, rate limiting, CORS protection

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React Frontend│◄───────►│  Express Backend │◄───────►│   PostgreSQL    │
│   (Vercel)      │  Socket │  (Vercel API)    │         │   (Supabase)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
         │                           │
         │                           ├──────────► Google Cloud Translation
         │                           ├──────────► Claude AI (Anthropic)
         └───────────────────────────┴──────────► Audio Storage (Base64)
```

## 🚀 Deploy for free (Render)

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for:
- Pushing the project to GitHub
- Deploying backend + frontend on Render (one free service)
- Setting up free PostgreSQL (Neon / Supabase) and env vars

## 🚀 Quick Start (5 Minutes – local)

### Prerequisites
```bash
Node.js >= 18.x
npm >= 9.x
PostgreSQL database (or use Supabase free tier)
```

### 1. Clone and Install
```bash
git clone <repository-url>
cd medical-translator

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/medical_translator"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_TRANSLATION_API_KEY="AIza..."
PORT=5000
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

### 3. Setup Database
```bash
cd backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed  # Creates demo users
```

### 4. Run Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

Visit **http://localhost:3000** and login with:
- Doctor: `doctor@medical.com` / `password123`
- Patient: `patient@medical.com` / `password123`

## 📦 Production Deployment

### Deploy to Vercel (Recommended - 10 Minutes)

#### 1. Setup Database (Supabase)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string from Settings → Database
4. Update `DATABASE_URL` in environment variables

#### 2. Deploy Backend API
```bash
cd backend
vercel --prod
# Follow prompts and set environment variables
```

#### 3. Deploy Frontend
```bash
cd frontend
# Update .env with production backend URL
vercel --prod
```

#### 4. Configure Environment Variables in Vercel

For **Backend**:
- `DATABASE_URL` - Your Supabase PostgreSQL URL
- `JWT_SECRET` - Secure random string
- `ANTHROPIC_API_KEY` - Your Claude API key
- `GOOGLE_TRANSLATION_API_KEY` - Your Google Cloud key

For **Frontend**:
- `REACT_APP_API_URL` - Your backend Vercel URL
- `REACT_APP_WS_URL` - Your backend Vercel URL (replace https with wss)

### Alternative: Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy backend
cd backend
railway up

# Deploy frontend
cd frontend
railway up
```

## 🔧 API Documentation

### REST Endpoints

#### Authentication
```
POST   /api/auth/register    - Create new user account
POST   /api/auth/login       - Login and get JWT token
POST   /api/auth/refresh     - Refresh access token
GET    /api/auth/me          - Get current user profile
```

#### Conversations
```
GET    /api/conversations              - List all user conversations
POST   /api/conversations              - Create new conversation
GET    /api/conversations/:id          - Get specific conversation
DELETE /api/conversations/:id          - Delete conversation
GET    /api/conversations/:id/messages - Get conversation messages
```

#### Messages
```
POST   /api/messages                   - Send new message (auto-translates)
GET    /api/messages/:id               - Get specific message
```

#### Search
```
GET    /api/search?q=keyword           - Search across conversations
GET    /api/search?q=keyword&conversationId=123  - Search within conversation
```

#### AI Summaries
```
POST   /api/summaries/:conversationId  - Generate medical summary
GET    /api/summaries/:conversationId  - Get existing summary
```

### WebSocket Events

#### Client → Server
```javascript
socket.emit('join_conversation', { conversationId, userId, role })
socket.emit('send_message', { conversationId, content, type, role })
socket.emit('typing', { conversationId, userId })
```

#### Server → Client
```javascript
socket.on('message_created', (message) => {...})
socket.on('message_translated', (translation) => {...})
socket.on('user_typing', (data) => {...})
socket.on('error', (error) => {...})
```

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test
npm run test:coverage

# Run frontend tests
cd frontend
npm test
npm test -- --coverage
```

## 🎨 Design Philosophy

The UI follows a **medical-grade, trust-focused aesthetic**:

- **Color Palette**: Professional blues (#0EA5E9, #0284C7) for doctor role, calm greens (#10B981) for patient role
- **Typography**: Clear, accessible sans-serif fonts for medical context
- **Layout**: Spacious, uncluttered design prioritizing readability
- **Visual Hierarchy**: Clear role distinction through color-coding and positioning
- **Micro-interactions**: Smooth transitions and loading states for professional feel
- **Accessibility**: WCAG 2.1 AA compliant, keyboard navigable

## 📊 Project Structure

```
medical-translator/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, auth, API configs
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic (translation, AI, storage)
│   │   ├── sockets/         # WebSocket handlers
│   │   ├── utils/           # Helper functions
│   │   └── server.ts        # Main application entry
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Demo data
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Main application pages
│   │   ├── services/        # API clients
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript definitions
│   │   └── App.tsx          # Root component
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── .github/
│   └── workflows/           # CI/CD pipelines
└── README.md
```

## 🔒 Security Features

- **JWT Authentication** with refresh token rotation
- **Password Hashing** using bcrypt
- **Rate Limiting** on all API endpoints
- **CORS Protection** with whitelist
- **SQL Injection Prevention** via Prisma ORM
- **XSS Protection** with helmet.js
- **Input Validation** on all user inputs
- **HTTPS Enforcement** in production

## 🌍 Supported Languages

100+ languages including:
- English, Spanish, French, German, Italian, Portuguese
- Chinese (Simplified & Traditional), Japanese, Korean
- Arabic, Hindi, Bengali, Urdu
- Russian, Polish, Turkish, Vietnamese
- And many more...

## 📈 Performance Optimizations

- **Database Indexing** on frequently queried fields
- **Connection Pooling** for database efficiency
- **Response Caching** for static data
- **Lazy Loading** for conversation history
- **WebSocket Heartbeat** for connection stability
- **Debounced Search** to reduce API calls
- **Code Splitting** for faster initial load

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify connection string in .env
echo $DATABASE_URL
```

**Translation API Error**
```bash
# Verify API key is set
echo $GOOGLE_TRANSLATION_API_KEY

# Check API quota in Google Cloud Console
```

**WebSocket Connection Failed**
```bash
# Ensure backend is running
curl http://localhost:5000/health

# Check CORS settings if accessing from different origin
```

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## 📧 Support

- **Issues**: GitHub Issues
- **Email**: support@medicaltranslator.com
- **Documentation**: https://docs.medicaltranslator.com

## 🙏 Acknowledgments

- **Anthropic Claude** for medical summarization
- **Google Cloud Translation** for real-time translation
- **Prisma** for database management
- **Socket.IO** for real-time communication

---

**Built with ❤️ for better healthcare communication worldwide**

Version: 1.0.0 | Last Updated: February 2026
