# ElectroMed - Deployment Guide

Complete guide for deploying ElectroMed to Vercel (Frontend) and Railway (Backend).

---

## 📋 Prerequisites

1. **GitHub Account** - Your code should be on GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Railway Account** - Sign up at [railway.app](https://railway.app)
4. **MongoDB Atlas Account** - For production database (or use Railway MongoDB)

---

## 🚀 Part 1: Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `thetradefusion-hub/electromeds`
5. Select the **`backend`** folder as the root directory

### Step 2: Add MongoDB Service

**Option A: Railway MongoDB (Recommended)**
1. In Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MongoDB"**
3. Railway will create a MongoDB instance
4. Copy the connection string from the MongoDB service

**Option B: MongoDB Atlas**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/electromed`

### Step 3: Configure Environment Variables

In Railway, go to your backend service → **Variables** tab, add:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Connection (from Step 2)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/electromed?retryWrites=true&w=majority

# JWT Secret (generate strong key)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRE=7d

# Frontend URL (will be your Vercel URL - update after frontend deployment)
FRONTEND_URL=https://your-app.vercel.app

# Optional: AI API Keys
LOVABLE_API_KEY=your-lovable-api-key
OPENAI_API_KEY=your-openai-key
GOOGLE_GEMINI_API_KEY=your-gemini-key

# Optional: WhatsApp API
WHATSAPP_API_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
```

**Generate JWT Secret:**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 4: Configure Build Settings

In Railway, go to **Settings** → **Build & Deploy**:

- **Root Directory**: `backend`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Watch Paths**: `backend/**`

### Step 5: Deploy

1. Railway will automatically detect your `package.json`
2. It will run `npm install` → `npm run build` → `npm start`
3. Wait for deployment to complete
4. Copy your **Railway backend URL** (e.g., `https://your-backend.railway.app`)

### Step 6: Test Backend

Visit: `https://your-backend.railway.app/health`

You should see:
```json
{
  "status": "OK",
  "message": "ElectroMed API is running",
  "timestamp": "..."
}
```

### Step 7: Seed Database (Optional)

After deployment, you can seed the database:

1. Go to Railway → Your backend service → **Settings** → **Deploy Logs**
2. Click **"Run Command"** or use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seed commands
railway run npm run seed:symptoms
railway run npm run seed:medicines
railway run npm run seed:rules
railway run npm run seed:plans
```

---

## 🎨 Part 2: Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository: `thetradefusion-hub/electromeds`
4. Vercel will auto-detect Vite configuration

### Step 2: Configure Build Settings

Vercel will auto-detect, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `./` (root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables

In Vercel project → **Settings** → **Environment Variables**, add:

```env
# Backend API URL (your Railway backend URL from Part 1)
VITE_API_URL=https://your-backend.railway.app/api
```

**Important**: 
- Replace `your-backend.railway.app` with your actual Railway backend URL
- Make sure to add `/api` at the end

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Wait for deployment (usually 2-3 minutes)
4. Copy your **Vercel frontend URL** (e.g., `https://your-app.vercel.app`)

### Step 5: Update Backend CORS

Go back to Railway → Backend service → **Variables**:

Update `FRONTEND_URL`:
```env
FRONTEND_URL=https://your-app.vercel.app
```

Railway will automatically redeploy with the new CORS settings.

---

## ✅ Part 3: Post-Deployment Setup

### 1. Update Environment Variables

**Backend (Railway):**
- ✅ `FRONTEND_URL` = Your Vercel URL
- ✅ `MONGODB_URI` = Your MongoDB connection string
- ✅ `JWT_SECRET` = Strong secret key

**Frontend (Vercel):**
- ✅ `VITE_API_URL` = Your Railway backend URL + `/api`

### 2. Seed Database

Run seed scripts to populate:
- Symptoms (110)
- Medicines (96)
- Medicine Rules (50)
- Subscription Plans (3)

### 3. Create Super Admin

You need to create a super admin user. You can:

**Option A: Use MongoDB directly**
```javascript
// Connect to MongoDB and run:
db.users.insertOne({
  email: "admin@electromed.com",
  password: "$2a$10$hashedpassword", // Use bcrypt to hash
  role: "super_admin",
  // ... other fields
});
```

**Option B: Create signup endpoint temporarily**
- Add a temporary admin signup route
- Create admin account
- Remove the route

**Option C: Use Railway CLI**
```bash
railway run node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-password', 10);
console.log('Hash:', hash);
"
```

### 4. Test Complete Flow

1. ✅ Visit frontend URL
2. ✅ Try to sign up (doctor signup)
3. ✅ Login
4. ✅ Test API calls
5. ✅ Check CORS (no errors in console)

---

## 🔧 Troubleshooting

### Backend Issues

**Problem: Build fails**
- Check Railway logs
- Ensure `backend/package.json` has correct scripts
- Verify TypeScript compilation

**Problem: MongoDB connection fails**
- Check `MONGODB_URI` format
- Verify MongoDB allows connections from Railway IPs
- For Atlas: Add `0.0.0.0/0` to IP whitelist (or Railway IPs)

**Problem: CORS errors**
- Verify `FRONTEND_URL` in Railway matches Vercel URL exactly
- Check backend logs for CORS errors
- Ensure frontend `VITE_API_URL` is correct

### Frontend Issues

**Problem: API calls fail**
- Check `VITE_API_URL` environment variable
- Verify backend is running (check `/health` endpoint)
- Check browser console for errors

**Problem: Build fails**
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

**Problem: 404 on routes**
- Verify `vercel.json` rewrite rules
- Check React Router configuration

---

## 📝 Environment Variables Summary

### Backend (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `production` |
| `MONGODB_URI` | MongoDB connection | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing key | `your-secret-key` |
| `JWT_EXPIRE` | Token expiry | `7d` |
| `FRONTEND_URL` | Vercel frontend URL | `https://app.vercel.app` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://backend.railway.app/api` |

---

## 🔐 Security Checklist

- [ ] Strong `JWT_SECRET` (min 32 characters)
- [ ] MongoDB connection string secured
- [ ] CORS configured correctly
- [ ] Environment variables not exposed in code
- [ ] `.env` files in `.gitignore`
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Helmet security headers enabled (backend)

---

## 📊 Monitoring

### Railway
- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: CPU, Memory usage
- **Deployments**: Deployment history

### Vercel
- **Analytics**: Page views, performance
- **Logs**: Function logs
- **Deployments**: Deployment history

---

## 🔄 Updating Deployment

### Backend Updates
1. Push changes to GitHub
2. Railway auto-deploys on push to `main` branch
3. Check deployment logs

### Frontend Updates
1. Push changes to GitHub
2. Vercel auto-deploys on push to `main` branch
3. Check deployment status

---

## 📞 Support

If you face issues:

1. **Check Logs**: Railway and Vercel both provide detailed logs
2. **Test Locally**: Ensure everything works locally first
3. **Environment Variables**: Double-check all variables are set
4. **CORS**: Most common issue - verify URLs match exactly

---

## 🎉 Success!

Once deployed:
- ✅ Frontend: `https://your-app.vercel.app`
- ✅ Backend: `https://your-backend.railway.app`
- ✅ Database: MongoDB (Atlas or Railway)
- ✅ All features working

**Next Steps:**
- Set up custom domains (optional)
- Configure email/SMS services
- Set up monitoring and alerts
- Enable backups

---

**Last Updated**: January 2025  
**Status**: Ready for Deployment
