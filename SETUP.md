# 🚀 TeamAGI — Complete Setup Guide

## Prerequisites (install these first)
- **Node.js 18+** → https://nodejs.org (download LTS version)
- **Git** → https://git-scm.com (optional)

---

## Step 1 — MongoDB Atlas (Free Database)

1. Go to **https://cloud.mongodb.com** → click **Try Free**
2. Create account → click **Build a Database** → choose **FREE (M0)**
3. Pick any cloud provider & region → click **Create**
4. **Create a database user:**
   - Username: `teamagi_user`
   - Password: click **Autogenerate** → **copy the password**
   - Click **Create User**
5. **Allow all IP addresses:**
   - Under "Where would you like to connect from?" → choose **My Local Environment**
   - In the IP Address box type `0.0.0.0/0` → click **Add Entry**
   - Click **Finish and Close**
6. **Get your connection string:**
   - Click **Connect** → **Drivers**
   - Copy the string that looks like: `mongodb+srv://teamagi_user:<password>@cluster0.xxxxx.mongodb.net/...`
   - Replace `<password>` with the password you copied in step 4
   - Replace `myFirstDatabase` (or whatever is after the `/`) with `teamagi`

Your final URI should look like:
```
mongodb+srv://teamagi_user:abc123xyz@cluster0.ab1cd.mongodb.net/teamagi?retryWrites=true&w=majority
```

---

## Step 2 — Cloudinary (Free Image Storage)

1. Go to **https://cloudinary.com** → **Sign Up For Free**
2. After signing in, go to your **Dashboard**
3. You'll see three values you need:
   - **Cloud Name** (e.g. `dxyz123abc`)
   - **API Key** (e.g. `123456789012345`)
   - **API Secret** (e.g. `AbCdEfGhIjKlMnOpQrStUvWxYz0`)

---

## Step 3 — Configure Environment Variables

1. Open the folder `nexus/backend`
2. Find the file `.env.example`
3. **Copy it and rename the copy to `.env`** (no `.example`)
   - Windows: Right-click → Copy → Paste → Rename to `.env`
   - Or in terminal: `copy .env.example .env`
4. Open `.env` in Notepad or VS Code
5. Fill in these values:

```env
MONGODB_URI=mongodb+srv://teamagi_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/teamagi?retryWrites=true&w=majority

JWT_ACCESS_SECRET=any_long_random_string_here_make_it_32_plus_chars
JWT_REFRESH_SECRET=another_different_long_random_string_32_plus_chars

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Tip for JWT secrets:** Just mash your keyboard for 40+ random characters, e.g.:
> `JWT_ACCESS_SECRET=kj2hKJ23hkjHKJ23hkjhKJH23kjhKJH23kjhKJH23`

---

## Step 4 — Install & Run Backend

Open a terminal (PowerShell or Command Prompt) in the `nexus/backend` folder:

```powershell
npm install
npm run dev
```

You should see:
```
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
🌐 TeamAGI Server running on port 5000 [development]
📡 API: http://localhost:5000/api
```

---

## Step 5 — Seed Sample Data (Optional but recommended)

In the same `nexus/backend` terminal:

```powershell
node utils/seeder.js
```

You should see:
```
✅ Connected to MongoDB
🗑️  Cleared existing data
👥 Created 6 users
🤝 Created follow relationships
📝 Created 10 posts
💬 Created sample comments
✅ Seed complete!
```

**Demo login credentials:**
| Email | Password | Role |
|-------|----------|------|
| `alex@teamagi.social` | `Test123!` | User |
| `sophia@teamagi.social` | `Test123!` | User |
| `admin@teamagi.social` | `Admin123!` | Admin |

---

## Step 6 — Install & Run Frontend

Open a **NEW terminal** in the `nexus/frontend` folder:

```powershell
npm install
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

## Step 7 — Open the App

Go to **http://localhost:5173** in your browser.

Both terminals must be running at the same time:
- Backend on port `5000`
- Frontend on port `5173`

---

## Common Errors & Fixes

### ❌ `Invalid scheme, expected connection string to start with "mongodb://"`
**Fix:** Your `.env` file is missing or `MONGODB_URI` still has placeholder text like `<username>`.
Make sure you:
1. Created the `.env` file (not just `.env.example`)
2. Replaced the full `MONGODB_URI` value with your real connection string

### ❌ `MongoServerError: bad auth`
**Fix:** Wrong username or password in your MongoDB URI. Go back to MongoDB Atlas → Database Access → edit the user → reset the password.

### ❌ `ECONNREFUSED` on frontend
**Fix:** The backend isn't running. Make sure you started `npm run dev` in the backend folder first.

### ❌ Images not uploading
**Fix:** Your Cloudinary credentials are wrong. Double-check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` from your Cloudinary dashboard.

### ❌ `Cannot find module '...'`
**Fix:** Run `npm install` in the folder where the error appears.

---

## Folder Structure

```
nexus/
├── backend/          ← Node.js + Express API (port 5000)
│   ├── .env          ← Your config file (create this!)
│   ├── .env.example  ← Template to copy from
│   └── ...
└── frontend/         ← React + Vite app (port 5173)
    └── ...
```
