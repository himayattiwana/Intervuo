# ⚡ Quick Start Deployment Guide

## 🎯 TL;DR - Get Your App Live in 30 Minutes

### Frontend (Netlify) - 10 minutes

1. **Go to [netlify.com](https://netlify.com)** → Sign up with GitHub
2. **"Add new site"** → **"Import from Git"** → Select `Intervuo` repo
3. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Add environment variable** (after backend is deployed):
   - Key: `VITE_API_BASE_URL`
   - Value: `https://your-backend-url.onrender.com`
5. **Deploy!** ✅

### Backend (Render) - 20 minutes

1. **Go to [render.com](https://render.com)** → Sign up with GitHub
2. **"New +"** → **"Web Service"** → Select `Intervuo` repo
3. **Settings**:
   - Root Directory: `Smart_Resume_Analyser_App-master`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn api:app --bind 0.0.0.0:$PORT`
4. **Environment Variables**:
   - `GEMINI_API_KEY`: Your API key from Google
   - `PORT`: `10000` (Render will override)
   - `FLASK_ENV`: `production`
   - `PYTHON_VERSION`: `3.9.18` (must be major.minor.patch format)
5. **Deploy!** ✅

6. **Copy backend URL** → Update Netlify `VITE_API_BASE_URL` → Redeploy frontend

### Database (Optional - App works without it for basic features)

For full functionality, you need a MySQL database:

1. **Option 1**: Use [PlanetScale](https://planetscale.com) (free MySQL)
2. **Option 2**: Use Railway MySQL addon
3. **Option 3**: Update code to use SQLite (simpler, no setup)

---

## 📝 Important Notes

- **Free tier limitations**: Render free tier services "sleep" after 15 min of inactivity. First request after sleep takes ~30 seconds.
- **Database**: The app needs MySQL. Consider using SQLite for simpler deployment (requires code changes).
- **File uploads**: Make sure file size limits are reasonable.

---

## 🔧 Quick Fixes

### Backend won't start?
- Check `requirements.txt` has all dependencies
- Verify `Procfile` exists
- Check environment variables are set

### Frontend can't connect to backend?
- Verify `VITE_API_BASE_URL` is correct
- Check backend CORS settings
- Make sure backend URL ends without trailing slash

### Database errors?
- The app tries to connect to localhost MySQL
- For production, you need to update the database connection code
- Or use a cloud MySQL service

---

## 📚 Full Guide

See `DEPLOYMENT.md` for detailed instructions with troubleshooting.

---

**Need help?** Check the logs in Netlify/Render dashboards!

