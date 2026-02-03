# Deploy Medical Translator (Free on Render)

This guide covers pushing the project to GitHub and deploying the app on Render (free tier). The backend and frontend are deployed as **one service**: the Node server serves both the API and the static frontend.

---

## 1. Push to GitHub

### 1.1 Create a new repository on GitHub

1. Go to [github.com](https://github.com) → **New repository**.
2. Name it (e.g. `medical-translator`).
3. Do **not** initialize with README (you already have code).
4. Create the repository.

### 1.2 Push from your machine

From the project root (`medical-translator/`):

```bash
cd /Users/aditgarg/Desktop/medical-translator

# Initialize git if not already
git init

# Add all files (respects .gitignore)
git add .

# First commit
git commit -m "Medical Translator: full-stack app ready for deploy"

# Add your GitHub repo as remote (replace YOUR_USERNAME and YOUR_REPO with yours)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push (main branch)
git branch -M main
git push -u origin main
```

If the repo was already initialized and has a different remote, update it:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## 2. Free PostgreSQL (choose one)

You need a PostgreSQL database. Free options:

- **Neon** (recommended): [neon.tech](https://neon.tech) → Create project → copy connection string.
- **Supabase**: [supabase.com](https://supabase.com) → New project → Settings → Database → Connection string (URI).
- **Render**: Dashboard → New → PostgreSQL → Create; use **Internal Database URL** if the app is on Render too.

Save the connection string; you will set it as `DATABASE_URL` on Render.

---

## 3. Deploy on Render

### 3.1 Create the Web Service

1. Go to [render.com](https://render.com) and sign in (or use GitHub).
2. **Dashboard** → **New +** → **Web Service**.
3. Connect your GitHub account if needed, then select the **medical-translator** repository.
4. Use these settings:

   | Field | Value |
   |-------|--------|
   | **Name** | `medical-translator` (or any name) |
   | **Region** | Oregon (or nearest) |
   | **Branch** | `main` |
   | **Root Directory** | *(leave blank)* |
   | **Runtime** | Node |
   | **Build Command** | `cd backend && npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && cp -r ../frontend ./public` |
   | **Start Command** | `cd backend && npm start` |
   | **Plan** | Free |

### 3.2 Environment variables

In the same Web Service, open **Environment** and add:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your PostgreSQL connection string (Neon, Supabase, or Render DB) |
| `JWT_SECRET` | A long random string (e.g. run `openssl rand -base64 32` and paste) |
| `OPENAI_API_KEY` | *(optional)* Your OpenAI key for AI Summary |
| `GOOGLE_TRANSLATION_API_KEY` | *(optional)* For Google Translate; omit to use free MyMemory |

Render sets `PORT` automatically; the app uses `process.env.PORT`.

### 3.3 Deploy

Click **Create Web Service**. Render will clone the repo, run the build, then start the app. The first deploy may take a few minutes.

### 3.4 Seed the database (once)

After the first successful deploy:

1. In Render, open your service → **Shell** tab (or use Local with env):

   **Option A – Render Shell**  
   Run:

   ```bash
   cd backend && npx prisma db seed
   ```

   **Option B – From your machine**  
   Set `DATABASE_URL` in your local `backend/.env` to the **same** production URL, then:

   ```bash
   cd backend && npx prisma db seed
   ```

2. Demo logins will work:
   - **Doctor:** `doctor@medical.com` / `password123`
   - **Patient:** `patient@medical.com` / `password123`

---

## 4. Your live app

- **URL:** `https://<your-service-name>.onrender.com`
- The same URL serves both the **frontend** (login, chat) and the **API** (e.g. `/api/auth/login`, `/health`).
- Free tier spins down after ~15 minutes of no traffic; the first request after that may take 30–60 seconds (cold start).

---

## 5. Optional: Render Blueprint

If you prefer a one-click deploy with a Render PostgreSQL database:

1. In the repo, `render.yaml` is already set up.
2. On Render: **New +** → **Blueprint** → connect the repo.
3. Render will create the Web Service (and optionally a PostgreSQL database if you add it to the blueprint).
4. Set `DATABASE_URL` (and optional API keys) in the service **Environment** as in section 3.2.

---

## 6. Troubleshooting

- **Build fails on Prisma migrate**  
  Ensure `DATABASE_URL` is set in Render **before** the first build so `prisma migrate deploy` can run.

- **App crashes or “Cannot find module”**  
  Build command must include `npm run build` and `cp -r ../frontend ./public` so the backend has a `public` folder and compiled `dist/`.

- **Blank page or API errors**  
  Confirm the service URL is correct and env vars (especially `DATABASE_URL` and `JWT_SECRET`) are set. Check **Logs** in the Render dashboard.

- **WebSockets (live messages)**  
  Render supports WebSockets; the app uses the same origin for API and frontend, so no extra CORS/WS config is needed.
