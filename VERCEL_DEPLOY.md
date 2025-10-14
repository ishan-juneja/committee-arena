# 🚀 Deploy to Vercel (EASIEST METHOD!)

Vercel is simpler and faster than Render for this project!

## ✅ Step 1: Push to GitHub

```bash
cd "/Users/ishanjuneja/Desktop/Committee Launch Game"

# If you haven't added the remote yet:
git remote add origin https://github.com/ishan-juneja/committee-arena.git

# Push your code
git push -u origin main
```

## ✅ Step 2: Deploy to Vercel

1. Go to: **https://vercel.com**
2. Click **"Sign Up"** (use GitHub login - easiest!)
3. Click **"Import Project"**
4. Select your `committee-arena` repository
5. **Framework Preset**: Other
6. **Build Command**: `npm run build`
7. **Output Directory**: Leave blank
8. **Install Command**: `npm install`
9. Click **"Deploy"**

## 🎉 Done!

In 2-3 minutes, you'll get a URL like:
```
https://committee-arena.vercel.app
```

**Share this URL with anyone!** They can play on:
- iPhone
- Android
- Computer
- Tablet
- Anywhere with a browser!

## 🔄 Updates

Every time you push to GitHub, Vercel will automatically redeploy! No extra steps!

```bash
git add .
git commit -m "Update game"
git push
```

Vercel will rebuild and update your live game automatically! 🎮

