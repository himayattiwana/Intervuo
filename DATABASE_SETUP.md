# 🗄️ Database Setup - Step by Step Guide

This guide walks you through setting up a MySQL database for your Intervuo backend on Render.

## ✅ Prerequisites

- Backend deployed on Render (already done ✅)
- PlanetScale account (we'll create this)

---

## 📋 Step-by-Step Instructions

### Step 1: Create PlanetScale Account (2 minutes)

1. **Go to PlanetScale**: [https://planetscale.com](https://planetscale.com)
2. **Click "Sign up"** (top right corner)
3. **Choose "Sign up with GitHub"** (recommended - uses your existing GitHub account)
4. **Authorize PlanetScale** when prompted
5. You'll be redirected to the PlanetScale dashboard

---

### Step 2: Create Database (3 minutes)

1. **In PlanetScale dashboard**, look for the **"New database"** button
   - It might be a big button in the center, or a "+" icon in the top right
2. **Click "New database"**
3. **Fill in the form**:
   - **Database name**: Type `intervuo-db` (or any name you prefer)
   - **Region**: 
     - If you're in US: Choose `us-east-1` or `us-west-2`
     - If you're in Europe: Choose `eu-west-1`
     - If you're in Asia: Choose `ap-south-1`
   - **Database engine**: ⚠️ **IMPORTANT** - Select **"Vitess"** (MySQL), NOT Postgres!
     - You should see two options: "Postgres" and "Vitess"
     - Click on **"Vitess"** - it says "MySQL at hyperscale"
     - Your app uses MySQL, so Postgres won't work!
   - **Plan/Cluster**: Look for the cheapest option available
     - If you see a free tier, select it
     - If only paid plans ($5/mo, $13/mo), see **Alternative Options** below
4. **Click "Create database"** (or continue through the setup)
5. **Wait 1-2 minutes** - PlanetScale will create your database
6. You'll see a success message and be taken to your database dashboard

**⚠️ If you don't see a free tier option:**
PlanetScale may have removed their free tier. See **Alternative Options** section below for free MySQL alternatives.

---

### Step 3: Get Connection Details (2 minutes)

1. **In your database dashboard**, look for the **"Connect"** button
   - It's usually in the top right corner, or in a sidebar
   - It might say "Connect" or show a connection icon
2. **Click "Connect"**
3. **A modal/popup will appear** with connection options
4. **Make sure the "General" tab is selected** (it should be by default)
5. **You'll see connection details** that look like this:

```
Host: aws.connect.psdb.cloud
Username: abc123xyz
Password: pscale_pw_xxxxxxxxxxxxx
Database: intervuo-db
Port: 3306
```

6. **Copy each value**:
   - Click the **copy icon** next to each field, OR
   - Select and copy the text manually
7. **IMPORTANT**: For the password:
   - Click **"Show password"** or the eye icon to reveal it
   - Copy the password immediately (it might be hidden for security)
   - Save it somewhere safe temporarily (you'll paste it into Render next)

---

### Step 4: Add Environment Variables to Render (5 minutes)

1. **Go to Render Dashboard**: [https://dashboard.render.com](https://dashboard.render.com)
2. **Click on your web service** (the backend you deployed - probably named `intervuo-backend`)
3. **In the left sidebar**, click **"Environment"**
   - If you don't see a sidebar, look for tabs at the top: "Overview", "Logs", "Environment", etc.
4. **Scroll down** to see your existing environment variables
   - You should already see: `GEMINI_API_KEY`, `FLASK_ENV`, `PORT`, `PYTHON_VERSION`
5. **Click "Add Environment Variable"** button (usually at the bottom or top of the list)

#### Add Variable 1: DB_HOST

1. **Key field**: Type exactly: `DB_HOST`
2. **Value field**: Paste the **Host** from PlanetScale (e.g., `aws.connect.psdb.cloud`)
   - Make sure there are NO spaces before or after
   - Don't include `https://` or `http://`
   - Just the hostname
3. **Click "Save Changes"** or the checkmark/save button
4. You'll see the variable appear in the list

#### Add Variable 2: DB_USER

1. **Click "Add Environment Variable"** again
2. **Key**: `DB_USER`
3. **Value**: Paste the **Username** from PlanetScale
4. **Click "Save Changes"**

#### Add Variable 3: DB_PASSWORD

1. **Click "Add Environment Variable"** again
2. **Key**: `DB_PASSWORD`
3. **Value**: Paste the **Password** from PlanetScale
   - Make sure you copied the FULL password (they can be long)
   - No spaces before or after
4. **Click "Save Changes"**

#### Add Variable 4: DB_NAME

1. **Click "Add Environment Variable"** again
2. **Key**: `DB_NAME`
3. **Value**: Paste the **Database name** from PlanetScale (e.g., `intervuo-db`)
4. **Click "Save Changes"**

#### Add Variable 5: DB_PORT

1. **Click "Add Environment Variable"** again
2. **Key**: `DB_PORT`
3. **Value**: `3306` (this is the default MySQL port)
   - Or use the port number from PlanetScale if it's different
4. **Click "Save Changes"**

---

### Step 5: Verify Deployment (2 minutes)

1. **After adding all variables**, Render will automatically start a new deployment
   - You'll see a notification or the deployment status will change
2. **Go to the "Logs" tab** in your Render service
3. **Wait for the deployment to complete** (usually 2-3 minutes)
4. **Look for these messages in the logs**:

   ✅ **Success looks like**:
   ```
   ✅ Database tables created successfully
   ```

   ❌ **Error looks like**:
   ```
   ❌ Database setup error: [error message]
   ```

5. **If you see an error**, check:
   - All 5 environment variables are added correctly
   - No typos in the variable names (case-sensitive!)
   - Values don't have extra spaces
   - Password was copied completely
   - Host doesn't include `https://` or protocol

---

## 🔍 Troubleshooting

### Error: "Access denied for user"
- **Problem**: Wrong username or password
- **Solution**: Double-check `DB_USER` and `DB_PASSWORD` in Render
- Make sure password was copied completely (they can be very long)

### Error: "Can't connect to MySQL server"
- **Problem**: Wrong host or port
- **Solution**: Check `DB_HOST` and `DB_PORT` values
- Make sure host doesn't include `https://` or `http://`

### Error: "Unknown database"
- **Problem**: Wrong database name
- **Solution**: Check `DB_NAME` matches exactly what's in PlanetScale

### Variables not updating
- **Problem**: Render might need a manual redeploy
- **Solution**: Go to "Manual Deploy" → "Deploy latest commit"

### Still having issues?
1. Check Render logs for the exact error message
2. Verify all 5 variables are present in Render Environment tab
3. Try removing and re-adding the variables
4. Make sure your code changes (api.py update) are committed and pushed to GitHub

---

## ✅ Checklist

Before moving on, verify:

- [ ] PlanetScale account created
- [ ] Database created in PlanetScale
- [ ] Connection details copied from PlanetScale
- [ ] All 5 environment variables added to Render:
  - [ ] `DB_HOST`
  - [ ] `DB_USER`
  - [ ] `DB_PASSWORD`
  - [ ] `DB_NAME`
  - [ ] `DB_PORT`
- [ ] Render deployment completed successfully
- [ ] Logs show "✅ Database tables created successfully"

---

## 🎉 Next Steps

Once your database is connected:

1. **Get your backend URL** from Render (e.g., `https://intervuo-backend.onrender.com`)
2. **Update Netlify** with the backend URL (see DEPLOYMENT.md Step 4)
3. **Test your app** end-to-end!

---

**Need help?** Check the Render logs for specific error messages and share them for assistance.

