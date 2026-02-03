# Quick Start Guide - Medical Translator

Get your Medical Translator application running in under 10 minutes!

## 🚀 Fastest Path to Running

### Local Development (No API Keys Required)

```bash
# 1. Clone the project
git clone <repository-url>
cd medical-translator

# 2. Setup Backend
cd backend
npm install

# 3. Create local database
# Make sure PostgreSQL is running, then:
createdb medical_translator

# 4. Configure environment
cp .env.example .env
# Edit .env and set:
# DATABASE_URL="postgresql://yourusername@localhost:5432/medical_translator"
# JWT_SECRET="any-random-string-here"
# (Leave API keys empty for mock mode)

# 5. Setup database
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# 6. Start backend
npm run dev
# Backend running on http://localhost:5000 ✅

# 7. Start frontend (in new terminal)
cd ../frontend
npm install
npm start
# Frontend running on http://localhost:3000 ✅
```

## 🎯 Login Credentials

After running `prisma db seed`, use these demo accounts:

**Doctor Account:**
- Email: `doctor@medical.com`
- Password: `password123`

**Patient Account:**
- Email: `patient@medical.com`
- Password: `password123`

## ✅ Verify Installation

1. **Backend Health Check:**
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","timestamp":"...","uptime":...}
```

2. **Login Test:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@medical.com","password":"password123"}'
# Should return: {"user":{...},"accessToken":"..."}
```

3. **Open Frontend:**
- Go to http://localhost:3000
- Login with doctor or patient credentials
- You should see the chat interface

## 🔑 Adding API Keys (Optional but Recommended)

### For Real Translation (Google Cloud)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable "Cloud Translation API"
3. Create API key in "Credentials"
4. Add to `.env`:
```env
GOOGLE_TRANSLATION_API_KEY="AIzaSyC..."
```
5. Restart backend

### For AI Summaries (Anthropic)

1. Go to [Anthropic Console](https://console.anthropic.com)
2. Create API key
3. Add to `.env`:
```env
ANTHROPIC_API_KEY="sk-ant-api03-..."
```
4. Restart backend

**Without API keys:** The app works in mock mode:
- Translation adds language prefix: `[Spanish] Hello` → `[English] Hello`
- AI summaries use keyword extraction

## 🎨 Features to Try

1. **Send Text Messages:**
   - Login as doctor, type a message
   - Login as patient (different browser/incognito), see translated message

2. **Record Audio:**
   - Click microphone button
   - Record a message
   - See audio player in conversation

3. **Search Conversations:**
   - Type keywords in search box
   - See highlighted results

4. **Generate AI Summary:**
   - Click "AI Summary" button
   - View extracted medical information

5. **Multiple Conversations:**
   - View list of past conversations in sidebar
   - Click to switch between them

## 📁 Project Structure

```
medical-translator/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Translation, AI logic
│   │   ├── sockets/      # WebSocket handlers
│   │   └── server.ts     # Main entry point
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.ts       # Demo data
│   └── package.json
├── frontend/
│   └── index.html        # Complete React app (single file)
├── README.md             # Full documentation
├── DEPLOYMENT.md         # Production deployment guide
├── ARCHITECTURE.md       # Technical architecture
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000
# If yes, kill process or change PORT in .env

# Check PostgreSQL is running
psql -l
# If not, start it:
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Database errors
```bash
# Reset database
cd backend
npx prisma migrate reset
npx prisma db seed
```

### Frontend not connecting
- Verify `API_URL` in `frontend/index.html` matches backend URL
- Check browser console for errors
- Ensure backend is running: `curl http://localhost:5000/health`

### WebSocket connection failed
- In production, ensure you're using `wss://` not `ws://`
- Check CORS settings in backend
- Verify firewall allows WebSocket connections

## 📚 Next Steps

1. **Read Full Documentation:** Check `README.md`
2. **Deploy to Production:** Follow `DEPLOYMENT.md`
3. **Understand Architecture:** Review `ARCHITECTURE.md`
4. **Customize:** Modify code for your needs
5. **Add Features:** Extend with your own functionality

## 🆘 Getting Help

- **Issues:** Open GitHub issue
- **Questions:** Check documentation files
- **Community:** Join discussions

## 🎉 You're Ready!

Your Medical Translator platform is now running. Start breaking language barriers in healthcare communication!

**Pro Tip:** Open two browser windows (one for doctor, one for patient) to see real-time translation in action!
