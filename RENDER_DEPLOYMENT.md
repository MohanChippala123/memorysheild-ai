# MemoryShield AI - Render Deployment Guide

## Overview

This guide deploys MemoryShield AI to Render with:
- ✅ PostgreSQL Database (with pgvector)
- ✅ Redis Cache Service
- ✅ FastAPI Backend
- ✅ React Frontend
- ✅ Automatic SSL/TLS
- ✅ Continuous Deployment from GitHub

---

## Prerequisites

1. **GitHub Account** - With memoryshield-ai repository pushed
2. **Render Account** - Free or paid (https://render.com)
3. **OpenAI API Key** - For embeddings (optional initially)

---

## Deployment Steps

### Step 1: Push to GitHub

If you haven't already:
```bash
cd "c:\Users\dayac\Downloads\New folder (2)\memoryshield-ai"

git remote add origin https://github.com/YOUR_USERNAME/memoryshield-ai.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Account

1. Go to https://render.com
2. Click "Sign up"
3. Connect GitHub account
4. Authorize Render to access your repositories

### Step 3: Deploy Using render.yaml

Render will automatically detect `render.yaml` in your repo.

**Option A: Use Render Dashboard**

1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Select your GitHub repository
4. Click "Create Blueprint"
5. Render will automatically deploy all services

**Option B: Deploy via GitHub**

1. Push your code with `render.yaml`
2. Render detects blueprint automatically
3. Click "Deploy" in GitHub integration

### Step 4: Configure Environment Variables

1. In Render Dashboard, go to each service
2. Set environment variables:

**Backend Service:**
```
DEBUG=false
ENVIRONMENT=production
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=(optional)
```

**Frontend Service:**
```
VITE_API_URL=https://memoryshield-backend.onrender.com/api/v1
NODE_ENV=production
```

### Step 5: Wait for Deployment

Services deploy in this order:
1. PostgreSQL Database (2-3 mins)
2. Redis Cache (1-2 mins)
3. Backend API (2-3 mins)
4. Frontend (2-3 mins)

**Total time:** ~10 minutes

### Step 6: Verify Deployment

✅ **Backend API:**
```
https://memoryshield-backend.onrender.com/
https://memoryshield-backend.onrender.com/docs  (API docs)
https://memoryshield-backend.onrender.com/api/v1/health
```

✅ **Frontend:**
```
https://memoryshield-frontend.onrender.com
```

---

## Service Details

### PostgreSQL Database
- **Version:** 16
- **Storage:** Free tier (512MB)
- **Backups:** Automatic daily
- **Extension:** pgvector (pre-installed)
- **Region:** Oregon (US)

### Redis Cache
- **Version:** 7
- **Plan:** Free tier
- **Memory:** 256MB
- **TLS:** Enabled
- **Region:** Oregon (US)

### Backend API (FastAPI)
- **Runtime:** Python 3.11
- **Framework:** FastAPI
- **Worker:** Uvicorn
- **Plan:** Free tier (shared CPU, 512MB RAM)
- **Scaling:** Manual (if needed)

### Frontend (React)
- **Runtime:** Node 18
- **Builder:** Vite
- **Serve:** Node serve
- **Plan:** Free tier (shared CPU, 512MB RAM)
- **Build Size:** ~185KB

---

## Monitoring

### View Logs

1. In Render Dashboard, select service
2. Click "Logs" tab
3. Real-time streaming logs

### Common Issues

**"Port already in use"**
- Render assigns port via $PORT env var
- Backend uses: `--port $PORT`
- Solution: Already configured ✅

**"Database connection timeout"**
- Wait 2-3 minutes for PostgreSQL to be ready
- Database URL is injected after database is created
- Check Render dashboard for database status

**"Frontend can't reach backend"**
- Ensure VITE_API_URL points to backend domain
- Example: `https://memoryshield-backend.onrender.com/api/v1`
- Rebuild frontend after changing

---

## Updating Deployment

### Push code changes:
```bash
git add .
git commit -m "Update MemoryShield"
git push origin main
```

Render automatically redeploys:
1. Detects commit to main branch
2. Pulls latest code
3. Rebuilds and restarts services
4. Takes ~5-10 minutes

### Disable auto-deploy (if needed):
1. Service Settings → "Auto-Deploy" toggle
2. Manual deploy: Click "Deploy" in dashboard

---

## Scaling & Upgrades

### Free Tier Limits
- CPU: Shared
- RAM: 512MB per service
- Database: 512MB storage
- Auto-sleep: After 15 mins inactivity (frontend)

### Upgrade to Paid
1. Select service
2. "Instance Type" → Choose paid plan
3. Automatic restart (no downtime)

**Recommended for production:**
- Backend: Starter plan ($7/mo)
- Frontend: Starter plan ($7/mo)
- Database: Standard plan ($15/mo)
- Redis: Standard plan ($15/mo)

---

## Database Management

### Access PostgreSQL

```bash
# Get connection string from Render dashboard
psql postgresql://user:pass@host:port/memoryshield

# Run migrations (if needed)
# This will be auto-run on deployment
```

### Initialize Database

Migrations are run automatically on deploy. To do manually:

```bash
# In Render backend shell
cd backend
alembic upgrade head
```

### Backup Database

1. Render dashboard → PostgreSQL service
2. Click "Backups" tab
3. Manual backup → "Take Backup"

---

## Security

### SSL/TLS
- ✅ Automatic HTTPS via Render
- ✅ All services behind secure connection
- ✅ Database connections encrypted

### Environment Variables
- ✅ Never commit secrets to git
- ✅ Set in Render dashboard
- ✅ Encrypted at rest
- ✅ Secure during transmission

### API Keys
1. Go to Render dashboard
2. Environment → "Add Secret"
3. Set OPENAI_API_KEY
4. Redeploy services

---

## Cost Estimate

### Free Tier
- Database: Free (512MB, limited)
- Redis: Free (256MB, limited)
- Backend: Free (but sleeps after 15 mins)
- Frontend: Free (but sleeps after 15 mins)
- **Total:** $0/month (with limitations)

### Starter Tier (Recommended)
- Database: $15/mo
- Redis: $15/mo
- Backend: $7/mo
- Frontend: $7/mo
- **Total:** ~$44/month

### Production Tier
- Database: $35/mo
- Redis: $35/mo
- Backend: $25/mo
- Frontend: $25/mo
- **Total:** ~$120/month

---

## Troubleshooting

### Service won't start

1. Check logs: Render Dashboard → Service → Logs
2. Common issues:
   - Missing environment variables
   - Incorrect DATABASE_URL
   - Port already in use (won't happen on Render)

### Frontend blank page

1. Check browser console for errors
2. Verify VITE_API_URL is correct
3. Check backend is running: https://memoryshield-backend.onrender.com/
4. Rebuild frontend: Trigger redeploy

### Backend API returns 500 errors

1. Check backend logs
2. Verify DATABASE_URL is correct
3. Wait for PostgreSQL to finish starting
4. Check OpenAI API key is valid (if using)

### Database connection issues

1. Check PostgreSQL service status in dashboard
2. Verify DATABASE_URL format
3. Test connection manually (if you have psql)
4. Database can take 2-3 minutes to initialize

---

## Next Steps

1. ✅ Deploy to Render
2. ✅ Test all endpoints
3. ✅ Add API keys for embeddings
4. ✅ Implement remaining phases
5. ✅ Add monitoring (Render metrics)
6. ✅ Setup alerts (Render alerts)

---

## Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **pgvector Docs:** https://github.com/pgvector/pgvector
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **React Docs:** https://react.dev

---

## Support

**Render Support:** https://support.render.com
**MemoryShield Issues:** Check repository issues

---

**Your MemoryShield AI is now live on the internet!** 🎉

Access it:
- Frontend: https://memoryshield-frontend.onrender.com
- Backend: https://memoryshield-backend.onrender.com
- API Docs: https://memoryshield-backend.onrender.com/docs
