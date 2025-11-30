# 🚂 Railway MySQL Setup - Free Database

Railway offers a free MySQL database that's perfect for your app!

## Step-by-Step Guide

### Step 1: Create Railway Account (2 minutes)

1. Go to [https://railway.app](https://railway.app)
2. Click **"Start a New Project"** or **"Login"**
3. Choose **"Login with GitHub"**
4. Authorize Railway to access your GitHub

### Step 2: Create MySQL Database (3 minutes)

1. In Railway dashboard, click **"New Project"**
2. Select **"Empty Project"** (or any option - doesn't matter)
3. Give it a name like `intervuo-database` (optional)
4. Click **"New"** button (top right, or in the project)
5. Select **"Database"**
6. Choose **"MySQL"**
7. Railway will automatically create a MySQL database for you
8. Wait 1-2 minutes for it to provision

### Step 3: Get Connection Details (2 minutes)

1. Click on the **MySQL service** you just created
2. Go to the **"Variables"** tab (in the top menu)
3. You'll see these variables:
   - `MYSQLHOST` - This is your DB_HOST
   - `MYSQLUSER` - This is your DB_USER
   - `MYSQLPASSWORD` - This is your DB_PASSWORD
   - `MYSQLDATABASE` - This is your DB_NAME
   - `MYSQLPORT` - This is your DB_PORT (usually 3306)

4. **Copy each value** (click the copy icon next to each)

### Step 4: Add to Render (5 minutes)

1. Go to your Render dashboard
2. Click on your backend service
3. Go to **"Environment"** tab
4. Add these environment variables:

   **Variable 1:**
   - Key: `DB_HOST`
   - Value: Paste `MYSQLHOST` value from Railway
   - Save

   **Variable 2:**
   - Key: `DB_USER`
   - Value: Paste `MYSQLUSER` value from Railway
   - Save

   **Variable 3:**
   - Key: `DB_PASSWORD`
   - Value: Paste `MYSQLPASSWORD` value from Railway
   - Save

   **Variable 4:**
   - Key: `DB_NAME`
   - Value: Paste `MYSQLDATABASE` value from Railway
   - Save

   **Variable 5:**
   - Key: `DB_PORT`
   - Value: Paste `MYSQLPORT` value from Railway (usually `3306`)
   - Save

5. Render will automatically redeploy
6. Check logs for "✅ Database tables created successfully"

## ✅ That's it!

Railway gives you:
- **500 hours/month free**
- **$5 credit monthly**
- **Easy setup**
- **No credit card required** (for free tier)

## 🎯 Next Steps

After database is connected:
1. Get your Render backend URL
2. Update Netlify with the backend URL
3. Test your app!

