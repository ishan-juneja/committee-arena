# 🚀 Committee Arena - Deployment Guide

## Option 1: Deploy to Render (FREE - Recommended)

### Server Deployment (Render)

1. **Create a Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Push to GitHub**
   ```bash
   git add -A
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. **Create Web Service on Render**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Use these settings:
     - **Name**: `committee-arena`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free`

4. **Add Environment Variables** (if needed)
   - `PORT`: 2567 (Render will override this automatically)

5. **Deploy!**
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Your server will be at: `https://committee-arena.onrender.com`

6. **Update Client URL**
   - Open `client/net/Network.js`
   - Change server URL:
   ```javascript
   const serverUrl = process.env.NODE_ENV === 'production' 
     ? 'wss://committee-arena.onrender.com'
     : 'ws://localhost:2567';
   ```

---

## Option 2: Deploy to Heroku (FREE)

1. **Install Heroku CLI**
   ```bash
   brew tap heroku/brew && brew install heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create committee-arena-game
   ```

4. **Add Procfile** (create `Procfile` in root):
   ```
   web: npm start
   ```

5. **Deploy**
   ```bash
   git add -A
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

6. **Open App**
   ```bash
   heroku open
   ```

---

## Option 3: Self-Host (Your Own Server)

### Requirements:
- A server with Node.js installed
- Public IP address or domain
- Port 2567 open

### Steps:

1. **SSH into your server**
   ```bash
   ssh user@your-server.com
   ```

2. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/committee-arena.git
   cd committee-arena
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Install PM2 (process manager)**
   ```bash
   npm install -g pm2
   ```

5. **Start server with PM2**
   ```bash
   pm2 start npm --name "committee-arena" -- start
   pm2 save
   pm2 startup
   ```

6. **Setup Nginx (reverse proxy)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:2567;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Get SSL Certificate (HTTPS)**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🎮 How Players Join Your Game

### Method 1: Direct Link (Easiest)
Just share your deployed URL:
```
https://committee-arena.onrender.com
```

Everyone who opens this link can:
1. Enter their name
2. Choose a color
3. Click "Join Game"
4. Start playing together!

### Method 2: QR Code
1. Go to https://qr.io
2. Enter your game URL
3. Generate QR code
4. Players scan to join!

### Method 3: Custom Domain (Professional)
1. Buy a domain (e.g., `committeearena.com`)
2. Point DNS to your Render/Heroku URL
3. Share `https://committeearena.com`

---

## 📊 Testing Multiplayer Locally

Before deploying, test with multiple players:

1. **Start server**
   ```bash
   npm start
   ```

2. **Open multiple browser tabs/windows**
   - Tab 1: http://localhost:2567
   - Tab 2: http://localhost:2567
   - Tab 3: http://localhost:2567
   - etc.

3. **Join with different names and colors**

4. **Test features:**
   - ✅ Movement (WASD)
   - ✅ Attack (SPACE)
   - ✅ Damage (hit each other)
   - ✅ Death (3 hits = death)
   - ✅ Emoji reveal on death

---

## 🔧 Troubleshooting

### "Can't connect to server"
- Check if server is running: `pm2 status`
- Check firewall: Port 2567 must be open
- Check URL in `Network.js` is correct

### "Players can't see each other"
- Check server logs: `pm2 logs committee-arena`
- Ensure WebSocket connection is established
- Check browser console for errors

### "Game is laggy with many players"
- Increase server resources
- Optimize network throttle in `GameScene.js`
- Reduce update frequency

---

## 📱 Mobile Support

The game already supports mobile:
- **Touch controls**: Virtual joystick + attack button
- **Responsive design**: Works on any screen size
- **iOS Safari**: Fully compatible
- **Android Chrome**: Fully compatible

Players can join from their phones using the same URL!

---

## 🎯 Next Steps

1. Deploy server to Render/Heroku
2. Update client URL in `Network.js`
3. Test with friends
4. Share the link!
5. (Optional) Buy custom domain
6. (Optional) Add analytics to track players

---

## 💡 Pro Tips

- **Free Tier Limits**: Render free tier sleeps after 15 min inactivity (first request takes ~30s to wake up)
- **Upgrade**: $7/month for always-on server
- **Monitoring**: Use Render dashboard to see active players
- **Logs**: Check server logs to debug issues
- **Updates**: Just push to GitHub, Render auto-deploys!

---

**Need help?** Check server logs or open an issue on GitHub!

