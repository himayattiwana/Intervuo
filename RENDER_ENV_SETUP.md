# Setting Up Environment Variables in Render

## 🔒 Keeping API Keys Private

Your API keys are now configured to use environment variables. Here's how to set them up in Render:

## Steps to Add Environment Variables in Render

### 1. Go to Your Render Dashboard
- Navigate to your backend service (the Flask API)
- Click on your service name

### 2. Open Environment Tab
- In the left sidebar, click on **"Environment"**
- Or go to: `https://dashboard.render.com/web/[your-service-name]/environment`

### 3. Add Environment Variables
Click **"Add Environment Variable"** and add these:

#### Required Variables:
```
GEMINI_API_KEY = YOUR_NEW_API_KEY_HERE
```

#### Optional Variables (if you want to customize):
```
GEMINI_MODEL = gemini-2.5-flash
NUM_QUESTIONS = 2
TEMPERATURE = 1.2
```

#### Database Variables (if using cloud database):
```
DB_HOST = your-database-host.render.com
DB_USER = your-database-user
DB_PASSWORD = your-database-password
DB_NAME = sra
DB_PORT = 3306
```

### 4. Save and Redeploy
- Click **"Save Changes"**
- Render will automatically redeploy your service with the new environment variables

## ✅ Verification

After deployment, your app will:
- ✅ Read `GEMINI_API_KEY` from environment variables
- ✅ Never expose the key in your code
- ✅ Work securely in production

## 🔐 Security Checklist

- [x] `config.py` is in `.gitignore` (already done)
- [x] Code updated to use `os.environ.get()`
- [ ] API key added to Render environment variables
- [ ] Old hardcoded key removed from code (done)
- [ ] Service redeployed after adding variables

## 🚨 Important Notes

1. **Never commit `config.py` with real keys** - It's already in `.gitignore`
2. **Use `config.py.example`** as a template for local development
3. **For local development**, create a `.env` file or set environment variables in your terminal
4. **Each environment** (local, staging, production) should have its own API key

## Local Development Setup

For local testing, you can either:

### Option 1: Create a local `config.py` (not committed)
```bash
cp Smart_Resume_Analyser_App-master/config.py.example Smart_Resume_Analyser_App-master/config.py
# Then edit config.py with your local API key
```

### Option 2: Use environment variables
```bash
# Windows PowerShell
$env:GEMINI_API_KEY="your-api-key-here"

# Windows CMD
set GEMINI_API_KEY=your-api-key-here

# Linux/Mac
export GEMINI_API_KEY=your-api-key-here
```

## 🎯 Quick Render Setup

1. **Render Dashboard** → Your Service → **Environment** tab
2. Add: `GEMINI_API_KEY` = `YOUR_NEW_API_KEY_HERE`
3. Click **Save Changes**
4. Wait for automatic redeploy (~2 minutes)

Done! Your API key is now secure and private. 🎉


