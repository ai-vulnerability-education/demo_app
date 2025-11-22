# Vercel + Railway Deployment Guide

## Overview

- **Frontend (Vercel):** FREE - Next.js app with global CDN
- **Backend (Railway):** $5/month - FastAPI with persistent disk
- **Total Cost:** $5/month

## Prerequisites

- GitHub account with your repository pushed
- Vercel account (https://vercel.com)
- Railway account (https://railway.app)
- OpenRouter API key ready

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway → Select `ai-vulnerability-education/demo_app`

### Step 2: Add Environment Variables

Click "Add variables":

```
OPENROUTER_API_KEY=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
ALLOWED_ORIGINS=*
ENVIRONMENT=production
```

### Step 3: Set Root Directory

1. Click service → Settings
2. Root Directory → Set to: `backend`
3. Click "Update"

### Step 4: Add Persistent Volume

1. Variables tab → "New Variable" → "Add Volume"
2. Mount path: `/app/data`
3. This saves `questions.json` permanently

### Step 5: Generate Domain

1. Settings → Networking → "Generate Domain"
2. Copy URL: `https://your-app.up.railway.app`

### Step 6: Test

```bash
curl https://your-app.up.railway.app/api/health
```

Expected: `{"status":"healthy"}`

## Part 2: Deploy Frontend to Vercel

### Step 1: Import Project

1. Go to https://vercel.com/dashboard
2. "Add New..." → "Project"
3. Import `ai-vulnerability-education/demo_app`

### Step 2: Configure

- **Root Directory:** `frontend`
- **Framework:** Next.js (auto-detected)
- **Build Command:** `npm run build`

### Step 3: Add Environment Variable

```
Name: NEXT_PUBLIC_API_URL
Value: https://your-app.up.railway.app
```

(Use your Railway URL from Part 1)

### Step 4: Deploy

Click "Deploy" → Wait 2-3 minutes

Your app: `https://your-project.vercel.app`

## Part 3: Test Everything

1. Open frontend URL
2. Click a question (nlp_003)
3. Select AI model (Llama 3.1 8B)
4. Click "Test Model"
5. Wait for results (10-30 seconds)
6. Refresh page → Results should persist

## Managing Your Deployment

### Update Environment Variables

**Railway:**
1. Service → Variables → Edit
2. Auto-redeploys

**Vercel:**
1. Project → Settings → Environment Variables
2. Deployments → Redeploy

### Update Code

```bash
git add .
git commit -m "Update"
git push origin main
```

Both platforms auto-deploy.

### View Logs

**Railway:** Service → Deployments → Active deployment
**Vercel:** Project → Deployments → Click deployment → Logs

## Cost

- **Railway:** $5/month (512MB RAM, persistent disk)
- **Vercel:** FREE (100GB bandwidth)
- **Total:** $5/month

## Troubleshooting

**Backend not responding:**
- Check Railway logs
- Verify environment variables
- Ensure root directory is `backend`
- Check volume mounted at `/app/data`

**Frontend shows "Failed to fetch":**
- Verify `NEXT_PUBLIC_API_URL` in Vercel
- Test backend: `curl https://your-backend/api/health`
- Check browser console for errors

**Data not persisting:**
- Verify volume mounted at `/app/data`
- Check Railway logs for disk errors

## Your URLs

Save these after deployment:

- Frontend: https://your-project.vercel.app
- Backend: https://your-app.up.railway.app
- API Docs: https://your-app.up.railway.app/docs

Ready to deploy! Follow Part 1 first, then Part 2.
