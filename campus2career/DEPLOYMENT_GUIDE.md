# 🚀 Campus2Career Deployment Guide

This guide will help you deploy Campus2Career to production using Vercel (frontend) and Railway/Render (backend).

## 📋 Table of Contents

1. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
2. [Backend Deployment (Railway)](#backend-deployment-railway)
3. [Environment Variables](#environment-variables)
4. [Post-Deployment Setup](#post-deployment-setup)
5. [Troubleshooting](#troubleshooting)

---

## 🎨 Frontend Deployment (Vercel)

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Prepare Your Repository
```bash
# Make sure all changes are committed and pushed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your GitHub repository: `Anushakoppula344/miniproject`
4. **IMPORTANT**: Configure the following settings:

**Framework Preset:** Next.js

**Root Directory:** `mini/campus2career/frontend`
   - Click "Edit" next to Root Directory
   - Enter: `mini/campus2career/frontend`
   - This is crucial!

**Build Command:** `npm run build`

**Output Directory:** `.next` (default is fine)

**Install Command:** `npm install`

#### Step 3: Configure Environment Variables
Click on **"Environment Variables"** and add:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_ENABLE_VOICE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

⚠️ **Note**: You'll need to deploy the backend first to get the backend URL.

#### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (2-5 minutes)
3. Your frontend will be live at: `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to frontend directory
cd mini/campus2career/frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## 🔧 Backend Deployment (Railway)

### Step 1: Prepare Backend

Create a `Procfile` in the backend directory if it doesn't exist:

```bash
cd mini/campus2career/backend
echo "web: node server.js" > Procfile
```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `Anushakoppula344/miniproject`

#### Railway Configuration

**Root Directory:** `mini/campus2career/backend`
   - In the project settings, set the root directory

**Start Command:** `node server.js`

**Environment Variables:**
Click on "Variables" and add the following:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus2career
JWT_SECRET=your-production-jwt-secret-key-change-this
JWT_REFRESH_SECRET=your-production-refresh-secret
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Step 3: Get Backend URL
1. Once deployed, Railway will provide a URL like: `https://your-app.railway.app`
2. Copy this URL - you'll need it for the frontend

### Step 4: Update Frontend Environment Variables
1. Go back to Vercel dashboard
2. Navigate to your project → Settings → Environment Variables
3. Update `NEXT_PUBLIC_API_URL` with your Railway backend URL
4. Redeploy: Settings → Deployments → Click ⋮ → Redeploy

---

## 🔐 Environment Variables

### Frontend (.env.local for Vercel)

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Feature Flags (Optional)
NEXT_PUBLIC_ENABLE_VOICE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Backend (.env for Railway)

```env
# Database - MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus2career?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-min-32-chars

# AI Service
GOOGLE_GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS - Your Frontend URL
FRONTEND_URL=https://your-campus2career.vercel.app

# File Upload (Optional - for cloud storage)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_BUCKET_NAME=campus2career-uploads
AWS_REGION=us-east-1
```

---

## 🛠️ Post-Deployment Setup

### 1. Configure CORS in Backend

Update `backend/server.js` to allow your Vercel domain:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://your-campus2career.vercel.app',
    'http://localhost:3000' // for development
  ],
  credentials: true
}));
```

### 2. MongoDB Atlas Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to Network Access
3. Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
   - For production, you can whitelist specific IPs

### 3. Create Admin User

After deployment, create an admin user:

```bash
# Option 1: Via MongoDB Atlas UI
# Connect to your cluster and insert:
{
  "fullName": "Admin User",
  "email": "admin@campus2career.com",
  "password": "$2b$10$hashed_password", // Use bcrypt to hash
  "role": "admin",
  "createdAt": new Date(),
  "updatedAt": new Date()
}

# Option 2: Via API endpoint (if you created one)
curl -X POST https://your-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "email": "admin@campus2career.com",
    "password": "SecurePassword123!",
    "role": "admin"
  }'
```

### 4. Test Your Deployment

Visit your deployed frontend:
```
https://your-campus2career.vercel.app
```

Test the following:
- ✅ User registration
- ✅ User login
- ✅ Admin login
- ✅ Interview creation
- ✅ Company management
- ✅ Profile updates
- ✅ Theme toggle
- ✅ File uploads

---

## 🔄 Alternative Backend Deployment (Render)

If you prefer Render over Railway:

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `campus2career-backend`
   - **Root Directory**: `mini/campus2career/backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free (or paid for better performance)

### Step 3: Add Environment Variables
Same as Railway configuration above.

### Step 4: Deploy
Click "Create Web Service" and wait for deployment.

---

## 🐛 Troubleshooting

### Issue: "No Next.js version detected"

**Solution 1: Set Root Directory**
In Vercel dashboard:
- Settings → General → Root Directory
- Set to: `mini/campus2career/frontend`
- Redeploy

**Solution 2: Use vercel.json**
The vercel.json file in your repo should have:
```json
{
  "buildCommand": "cd mini/campus2career/frontend && npm install && npm run build",
  "outputDirectory": "mini/campus2career/frontend/.next"
}
```

### Issue: Backend not connecting to MongoDB

**Check:**
1. MongoDB Atlas IP whitelist (allow 0.0.0.0/0)
2. Connection string format is correct
3. Database user has read/write permissions
4. Environment variables are set in Railway/Render

### Issue: CORS errors

**Solution:**
Update backend CORS configuration:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

Make sure `FRONTEND_URL` is set correctly in backend environment variables.

### Issue: File uploads not working

**For Production:**
Use cloud storage instead of local filesystem:
- AWS S3
- Cloudinary
- Railway Volumes (persistent storage)

**Quick Fix:**
Configure Multer to use memory storage temporarily and save to database.

### Issue: 404 on page refresh

**Solution:**
Vercel automatically handles Next.js routing. If issues persist:
1. Check your Next.js app router configuration
2. Ensure pages are in the correct directory structure
3. Verify build completed successfully

---

## 📊 Monitoring & Maintenance

### Vercel Dashboard
- Monitor deployment status
- View build logs
- Check analytics and performance
- Configure custom domains

### Railway Dashboard
- Monitor backend health
- View server logs
- Check CPU/Memory usage
- Configure scaling

### MongoDB Atlas
- Monitor database performance
- View query analytics
- Set up alerts for high usage
- Backup configuration

---

## 🔒 Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS only
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication
- [ ] Review and minimize environment variable exposure
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Configure database backups
- [ ] Review and update security headers

---

## 🎉 Success!

Your Campus2Career platform should now be live! 

**Share your deployment:**
- Frontend: https://your-project.vercel.app
- Backend: https://your-backend.railway.app

**Next Steps:**
1. Set up custom domain (optional)
2. Configure SSL certificates
3. Set up monitoring and alerts
4. Plan for scaling
5. Regular backups

---

## 📞 Support

If you encounter issues:
1. Check the [Vercel Documentation](https://vercel.com/docs)
2. Check the [Railway Documentation](https://docs.railway.app)
3. Review [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
4. Open an issue on GitHub

**Happy Deploying! 🚀**

