# Medical Translator

A real-time multilingual chat platform for doctor–patient communication. Breaks language barriers in healthcare with instant translation and AI-powered summaries.

## Functionalities

- **Real-time translation** – Messages translated between doctor and patient languages (100+ languages via MyMemory/Google)
- **Live chat** – Instant message delivery with WebSockets
- **Language selection** – Doctor and patient choose their preferred language per conversation
- **Audio messages** – Record and send voice notes in the chat
- **Search** – Full-text search across conversations with scroll-to-result
- **AI medical summary** – Extracts symptoms, diagnoses, medications, and follow-up actions (OpenAI)

## Local setup

```bash
cd backend && npm install
cp backend/.env.example backend/.env   # Edit with your DATABASE_URL, JWT_SECRET
npx prisma generate && npx prisma migrate dev && npx prisma db seed
npm run dev
```

```bash
cd frontend && npm install && npm start
```

**Demo:** `doctor@medical.com` / `patient@medical.com` — password: `password123`

## Deploy on Render

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New** → **Web Service**.
3. Connect the repo and use:

   | Field | Value |
   |-------|-------|
   | **Build Command** | `cd backend && npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && cp -r ../frontend ./public` |
   | **Start Command** | `cd backend && npm start` |

4. Add **Environment Variables**:
   - `DATABASE_URL` – PostgreSQL URL (free: [Neon](https://neon.tech) or [Supabase](https://supabase.com))
   - `JWT_SECRET` – Random string (e.g. `openssl rand -base64 32`)
   - `OPENAI_API_KEY` – *(optional)* For AI Summary

5. Deploy. After it’s live, run `npx prisma db seed` (via Render Shell or locally with prod `DATABASE_URL`) to create demo users.

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed steps.
