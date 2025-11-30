# 🚀 Deployment Guide for Intervuo

This guide will walk you through deploying your Intervuo application to production.

## 📋 Overview

Your application consists of:
- **Frontend**: React/Vite application (deploy to Netlify)
- **Backend**: Flask Python API (deploy to Render/Railway/Fly.io)

## 🎯 Prerequisites

- GitHub account (your code is already there)
- Netlify account (free tier available)
- Render/Railway account (free tier available)
- Your Gemini API key

---

## Part 1: Frontend Deployment (Netlify)

### Step 1: Prepare Environment Variables

1. Go to your repository on GitHub
2. Ensure your code is pushed (already done ✅)

### Step 2: Create Netlify Account

1. Go to [https://www.netlify.com](https://www.netlify.com)
2. Click "Sign up" and use your GitHub account
3. Authorize Netlify to access your repositories

### Step 3: Deploy Frontend

1. In Netlify dashboard, click **"Add new site"** → **"Import an existing project"**
2. Select **GitHub** as your Git provider
3. Find and select your `Intervuo` repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Branch to deploy**: `main`
5. Click **"Show advanced"** and add environment variables:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://your-backend-url.onrender.com` (we'll get this after backend deployment)
6. Click **"Deploy site"**

### Step 4: Set Environment Variable After Backend Deployment

After deploying the backend (Part 2), update the environment variable:

1. Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
2. Edit `VITE_API_BASE_URL` and set it to your backend URL
3. Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

### Step 5: Custom Domain (Optional)

1. Netlify automatically assigns you a domain like `your-app-name.netlify.app`
2. To add a custom domain:
   - Go to **Domain settings**
   - Click **"Add custom domain"**
   - Follow the instructions

---

## Part 2: Backend Deployment (Render)

### Option A: Using Render (Recommended for Free Tier)

#### Step 1: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up with your GitHub account

#### Step 2: Create New Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub account if not already connected
3. Select the `Intervuo` repository
4. Configure the service:
   - **Name**: `intervuo-backend` (or any name you prefer)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `Smart_Resume_Analyser_App-master`
   - **Runtime**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**: 
     ```bash
     gunicorn api:app --bind 0.0.0.0:$PORT
     ```
5. Add Environment Variables:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `FLASK_ENV`: `production`
   - `PORT`: `10000` (Render will override this)
   - `PYTHON_VERSION`: `3.9.18` (must be in format major.minor.patch, e.g., 3.9.18)
   
   **Note**: Render may automatically detect Python version from `runtime.txt`. If you get an error about PYTHON_VERSION, you can either:
   - Set it as an environment variable (recommended)
   - Or remove the variable and let Render auto-detect from `runtime.txt`

6. Click **"Create Web Service"**

#### Step 3: Configure Database

Since your backend uses MySQL, you need to set up a database. **We'll use PlanetScale (free MySQL service)** as it's the easiest option.

**IMPORTANT**: The code has already been updated to use environment variables. You just need to set up the database and add the credentials.

##### Option A: Using PlanetScale (Recommended - Free MySQL)

**Step 3.1: Create PlanetScale Account**

1. Go to [https://planetscale.com](https://planetscale.com)
2. Click **"Sign up"** (top right)
3. Choose **"Sign up with GitHub"** (easiest option)
4. Authorize PlanetScale to access your GitHub account
5. You'll be redirected to the PlanetScale dashboard

**Step 3.2: Create a New Database**

1. In PlanetScale dashboard, click the **"New database"** button (or "+" icon)
2. Choose **"Create new database"**
3. Fill in the form:
   - **Database name**: `intervuo-db` (or any name you like)
   - **Region**: Choose the region closest to you (e.g., `us-east-1` for US East)
   - **Plan**: Select **"Hobby"** (free tier)
4. Click **"Create database"**
5. Wait 1-2 minutes for the database to be created

**Step 3.3: Get Database Connection Credentials**

1. Once your database is created, click on it to open the database dashboard
2. Click on the **"Connect"** button (top right, or in the sidebar)
3. A modal will appear with connection options
4. Select **"General"** tab (should be selected by default)
5. You'll see connection details. Look for:
   - **Host**: Something like `aws.connect.psdb.cloud`
   - **Username**: Your database username
   - **Password**: Click **"Show password"** to reveal it (copy this immediately!)
   - **Database name**: The name you chose (e.g., `intervuo-db`)
   - **Port**: Usually `3306` (default MySQL port)

6. **IMPORTANT**: Copy all these values. You'll need them in the next step!

**Step 3.4: Add Environment Variables to Render**

1. Go back to your Render dashboard
2. Click on your web service (the backend you deployed)
3. In the left sidebar, click **"Environment"**
4. Scroll down to see existing environment variables
5. Click **"Add Environment Variable"** button
6. Add each variable one by one:

   **Variable 1:**
   - **Key**: `DB_HOST`
   - **Value**: Paste the Host from PlanetScale (e.g., `aws.connect.psdb.cloud`)
   - Click **"Save Changes"**

   **Variable 2:**
   - **Key**: `DB_USER`
   - **Value**: Paste the Username from PlanetScale
   - Click **"Save Changes"**

   **Variable 3:**
   - **Key**: `DB_PASSWORD`
   - **Value**: Paste the Password from PlanetScale (the one you revealed)
   - Click **"Save Changes"**

   **Variable 4:**
   - **Key**: `DB_NAME`
   - **Value**: Paste the Database name from PlanetScale (e.g., `intervuo-db`)
   - Click **"Save Changes"**

   **Variable 5:**
   - **Key**: `DB_PORT`
   - **Value**: `3306` (or the port number from PlanetScale if different)
   - Click **"Save Changes"**

7. After adding all variables, Render will automatically redeploy your service
8. Wait for the deployment to complete (check the "Events" or "Logs" tab)

**Step 3.5: Verify Database Connection**

1. Go to the **"Logs"** tab in your Render service
2. Look for messages like:
   - `✅ Database tables created successfully` (success!)
   - OR `❌ Database setup error: ...` (if there's an error)
3. If you see an error, double-check:
   - All environment variables are spelled correctly
   - No extra spaces in the values
   - Password was copied completely
   - Host doesn't include `https://` or `http://` (just the hostname)

##### Option B: Using Render PostgreSQL (Alternative - Requires Code Changes)

If you prefer to use Render's built-in PostgreSQL:

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `intervuo-postgres`
   - **Database**: `intervuo_db`
   - **User**: Auto-generated
   - **Region**: Same as your web service
   - **Plan**: Free
3. Click **"Create Database"**
4. **Note**: You'll need to modify `api.py` to use PostgreSQL instead of MySQL (requires changing `pymysql` to `psycopg2` and SQL syntax)

**We recommend Option A (PlanetScale) as it requires no code changes.**

#### Step 4: Get Backend URL

1. After deployment completes, Render will provide a URL like: `https://intervuo-backend.onrender.com`
2. Copy this URL
3. Update Netlify environment variable `VITE_API_BASE_URL` with this URL

---

### Option B: Using Railway (Alternative)

#### Step 1: Create Railway Account

1. Go to [https://railway.app](https://railway.app)
2. Sign up with GitHub

#### Step 2: Deploy Backend

1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select your `Intervuo` repository
3. Railway will auto-detect it's a Python app
4. Set the **Root Directory** to `Smart_Resume_Analyser_App-master`
5. Add environment variables:
   - `GEMINI_API_KEY`: Your API key
   - `PORT`: Railway sets this automatically

#### Step 3: Add Database

1. Click **"New"** → **"Database"** → **"MySQL"**
2. Railway will automatically link it to your service
3. Update environment variables for database connection

---

## Part 3: Database Setup

### Using PlanetScale (MySQL - Free Tier)

1. Go to [https://planetscale.com](https://planetscale.com)
2. Sign up and create a database
3. Get connection credentials
4. Update your backend environment variables

### Using Railway MySQL

1. Add MySQL service in Railway
2. Copy connection string
3. Parse and set individual variables

---

## Part 4: Update Backend Code for Production

### Update `api.py` Database Connection

You need to update the database connection in `api.py` to use environment variables:

```python
import os

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'sra')

db_connection = pymysql.connect(
    host=DB_HOST, 
    user=DB_USER, 
    password=DB_PASSWORD
)
db_cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME};")
db_connection.select_db(DB_NAME)
```

### Update CORS Settings

Make sure CORS allows your Netlify domain:

```python
from flask_cors import CORS

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
CORS(app, resources={r"/api/*": {"origins": [FRONTEND_URL, "https://*.netlify.app"]}})
```

---

## Part 5: Required Files for Backend

### Create `requirements.txt` for Production

Make sure your `Smart_Resume_Analyser_App-master/requirements.txt` includes:

```
flask
flask-cors
gunicorn
pdfminer.six
google-generativeai
pymysql
# ... all other dependencies
```

### Create `Procfile` (if using Render)

Create `Smart_Resume_Analyser_App-master/Procfile`:

```
web: gunicorn api:app --bind 0.0.0.0:$PORT
```

### Create `runtime.txt`

Create `Smart_Resume_Analyser_App-master/runtime.txt`:

```
python-3.9.18
```

---

## Part 6: File Storage

Your backend saves files to local directories. For production, consider:

1. **Use cloud storage** (AWS S3, Cloudinary, etc.)
2. **Use temporary storage** (files are deleted after processing)
3. **Limit file size** in your Flask app

For now, the local storage should work on most platforms.

---

## Part 7: Testing Your Deployment

1. **Frontend**: Visit your Netlify URL
2. **Backend**: Test API endpoint: `https://your-backend-url.onrender.com/api/analyze-resume`
3. **Full Flow**:
   - Upload a resume
   - Generate questions
   - Complete an interview
   - View report

---

## Part 8: Troubleshooting

### Frontend Issues

- **API calls failing**: Check `VITE_API_BASE_URL` environment variable
- **CORS errors**: Update backend CORS settings
- **Build fails**: Check Node version in `package.json`

### Backend Issues

- **503 errors**: Service might be sleeping (free tier limitation)
- **Database errors**: Check database connection variables
- **Import errors**: Check all dependencies in `requirements.txt`
- **Port errors**: Make sure using `$PORT` environment variable

### Common Solutions

1. **Service sleeping** (Render free tier):
   - First request after inactivity takes ~30 seconds
   - Consider upgrading or using a different service

2. **File upload size**:
   - Check platform limits (usually 100MB)
   - Add file size validation

3. **Memory limits**:
   - Free tiers have memory limits
   - Optimize your code if hitting limits

---

## Part 9: Monitoring

### Netlify Analytics

- Go to Netlify Dashboard → Analytics
- View site traffic and performance

### Render Logs

- Go to Render Dashboard → Your Service → Logs
- Monitor errors and requests

---

## Quick Checklist

- [ ] Frontend deployed to Netlify
- [ ] Backend deployed to Render/Railway
- [ ] Database configured
- [ ] Environment variables set
- [ ] CORS configured
- [ ] API URL updated in frontend
- [ ] Tested full flow
- [ ] Custom domain configured (optional)

---

## Support

If you encounter issues:
1. Check the logs in your hosting platform
2. Verify all environment variables
3. Test endpoints individually
4. Check CORS settings
5. Verify database connection

---

**Happy Deploying! 🎉**

