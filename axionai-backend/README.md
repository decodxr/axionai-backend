# AxionAI Backend API

Production-ready Express backend for the AxionAI Discord bot dashboard.

## 📁 File Structure

```
backend/
├── src/
│   ├── index.js              # Entry point
│   ├── db.js                 # JSON database (lowdb)
│   ├── middleware/
│   │   └── auth.js           # Bearer token validation
│   └── routes/
│       ├── auth.js           # POST /auth/discord/callback
│       ├── users.js          # GET /users/@me
│       ├── guilds.js         # GET/PUT /guilds/:id/config, stats
│       └── stats.js          # GET /stats
├── db/                       # Auto-created, stores axionai.json
├── .env.example
├── package.json
└── README.md
```

## ⚡ Quick Start (Local)

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

Server runs at: `http://localhost:3001`

## 🔐 Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3001) |
| `DISCORD_CLIENT_ID` | From Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | From Discord Developer Portal |
| `DISCORD_REDIRECT_URI` | Must match exactly in Discord portal |
| `DISCORD_BOT_TOKEN` | Bot token (for member counts) |
| `FRONTEND_URL` | Allowed CORS origin |

## 📡 API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/discord/callback` | ❌ | Exchange Discord code for token |
| `GET` | `/users/@me` | ✅ | Get current user |
| `GET` | `/guilds` | ✅ | List managed guilds |
| `GET` | `/guilds/:id/config` | ✅ | Get guild config |
| `PUT` | `/guilds/:id/config` | ✅ | Update guild module config |
| `GET` | `/guilds/:id/stats` | ✅ | Get guild stats |
| `GET` | `/stats` | ❌ | Global bot stats |
| `GET` | `/health` | ❌ | Health check |

## 🚀 Deploy on Render

1. Push `backend/` folder to a GitHub repo
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node version:** 18+
5. Add all Environment Variables from `.env.example`
6. Deploy!

> ⚠️ Render free tier sleeps after inactivity. Use paid plan or Railway for always-on.

## 🚀 Deploy on Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. Deploy from GitHub repo
3. Set root directory to `backend/`
4. Add environment variables
5. Railway auto-detects the start script

## 🔑 Discord Developer Portal Setup

1. Go to https://discord.com/developers/applications
2. Select your application → **OAuth2**
3. Add Redirect URI: `https://axionai-app.base44.app/auth/discord/callback`
4. Required Scopes: `identify`, `guilds`
5. Copy **Client ID** and **Client Secret** to your `.env`

## 💾 Database

Uses `lowdb` (JSON file) stored at `db/axionai.json`.

**Pros:** Zero setup, works anywhere, no cloud costs.  
**Cons:** Not suitable for high concurrency (1000+ simultaneous writes).

**To migrate to MongoDB:** Replace `src/db.js` functions with MongoDB equivalents — the route files don't need changes.

## 🔒 Auth Flow

```
Frontend                    Backend                    Discord API
   |                           |                            |
   |── { code } ──────────────>|                            |
   |                           |── POST /oauth2/token ────>|
   |                           |<── { access_token } ───---|
   |                           |── GET /users/@me ─────── >|
   |                           |<── { user } --------------|
   |                           |── save to DB              |
   |<── { token, user } ───────|                            |
   |                           |                            |
   |── GET /guilds             |                            |
   |   Authorization: Bearer {token}                       |
   |                           |── verify token in DB      |
   |                           |── GET /users/@me/guilds ->|
   |                           |<── [guilds] --------------|
   |<── [enriched guilds] ─────|                            |
``