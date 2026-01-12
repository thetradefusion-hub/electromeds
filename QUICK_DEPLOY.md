# 🚀 Quick Deployment Guide - ElectroMed

## Fast Track Deployment (5 Minutes)

### Backend → Railway

1. **Go to Railway**: [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub** → Select `thetradefusion-hub/electromeds`
3. **Settings** → **Root Directory**: `backend`
4. **Add MongoDB**: Click **"+ New"** → **"Database"** → **"Add MongoDB"**
5. **Variables** → Add these:

```env
NODE_ENV=production
MONGODB_URI=<from MongoDB service>
JWT_SECRET=<generate strong key>
FRONTEND_URL=<update after Vercel>
```

6. **Deploy** → Copy backend URL (e.g., `https://xxx.railway.app`)

---

### Frontend → Vercel

1. **Go to Vercel**: [vercel.com](https://vercel.com)
2. **New Project** → Import `thetradefusion-hub/electromeds`
3. **Environment Variables** → Add:

```env
VITE_API_URL=https://xxx.railway.app/api
```

4. **Deploy** → Copy frontend URL (e.g., `https://xxx.vercel.app`)

---

### Update Backend CORS

Go back to Railway → **Variables** → Update:

```env
FRONTEND_URL=https://xxx.vercel.app
```

---

## ✅ Done!

- Frontend: `https://xxx.vercel.app`
- Backend: `https://xxx.railway.app`
- Database: MongoDB (Railway)

**Next**: Seed database and create admin user (see `DEPLOYMENT_GUIDE.md`)
