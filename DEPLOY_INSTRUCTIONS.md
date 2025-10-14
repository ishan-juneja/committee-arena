# 🚀 DEPLOYMENT GUIDE - Step by Step

## ✅ Your Project is Ready to Deploy!

Follow these steps **exactly** to get your game online:

---

## Step 1: Create GitHub Repository (5 minutes)

### 1.1 - Go to GitHub
- Open: https://github.com/new
- (If you don't have an account, create one first)

### 1.2 - Create Repository
- **Repository name**: `committee-arena` (or any name you like)
- **Description**: "2D Multiplayer Arena Game"
- **Visibility**: Public
- **DO NOT** initialize with README, .gitignore, or license
- Click **"Create repository"**

### 1.3 - Connect Your Code to GitHub
Copy and paste these commands **one at a time** in your terminal:

```bash
cd "/Users/ishanjuneja/Desktop/Committee Launch Game"

git remote add origin https://github.com/YOUR-USERNAME/committee-arena.git

git branch -M main

git push -u origin main
```

**Replace `YOUR-USERNAME` with your actual GitHub username!**

Example: If your username is `johndoe`:
```bash
git remote add origin https://github.com/johndoe/committee-arena.git
```

---

## Step 2: Deploy on Render.com (3 minutes)

### 2.1 - Create Render Account
- Go to: https://render.com
- Click **"Get Started"**
- Sign up with GitHub (easiest option)

### 2.2 - Create New Web Service
1. Click **"New +"** (top right)
2. Select **"Web Service"**
3. Click **"Connect account"** to connect GitHub
4. Find and select your `committee-arena` repository
5. Click **"Connect"**

### 2.3 - Configure the Service
**Name**: `committee-arena` (or anything you like)

**Environment**: `Node`

**Build Command**:
```
npm install && npm run build
```

**Start Command**:
```
npm start
```

**Instance Type**: `Free`

Click **"Create Web Service"**

### 2.4 - Wait for Deployment
- Render will start building (takes 3-5 minutes)
- You'll see logs in real-time
- Wait for: ✅ "Deploy succeeded"

---

## Step 3: Get Your Game URL

Once deployed:
1. You'll see your URL at the top: `https://committee-arena.onrender.com`
2. Click it to open your game!
3. **Share this URL** with anyone - they can all play!

---

## 🎮 Sharing Your Game

**Your Game URL**: `https://YOUR-APP-NAME.onrender.com`

Share this link:
- ✅ Friends can open on phone
- ✅ Friends can open on computer
- ✅ Works anywhere in the world
- ✅ No installation needed

---

## 🔧 Updating Your Game

After making changes:

```bash
cd "/Users/ishanjuneja/Desktop/Committee Launch Game"
git add -A
git commit -m "Update game"
git push origin main
```

Render will **automatically redeploy** in ~3 minutes!

---

## ⚠️ Important Notes

### First Load is Slow
- Free tier "sleeps" after 15 minutes of inactivity
- First visitor after sleep = 30-60 second load time
- After that = instant!

### Upgrade to Always-On
- $7/month for 24/7 availability
- No sleep time
- Faster performance

### Check Logs
- If something breaks, click "Logs" in Render dashboard
- Shows server errors

---

## 🆘 Troubleshooting

### "Failed to connect"
- Check Render logs for errors
- Make sure deploy succeeded
- Try hard refresh (Cmd+Shift+R)

### "Can't find repository"
- Make sure you pushed to GitHub (`git push origin main`)
- Refresh Render's repository list

### Game works locally but not online
- Check browser console (F12) for errors
- Verify WebSocket connection in Network tab

---

## 📊 Your Game Stats

Check Render dashboard to see:
- Active players
- Server uptime
- Memory usage
- Deploy history

---

**Need help? The game is ready to deploy - just follow steps 1-3 above!** 🚀

