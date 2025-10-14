# ⚡ Quick Start Guide

Get your Committee Arena game running in 30 seconds!

## 🎯 Three Simple Steps

### 1️⃣ Start the Server

Open a terminal and run:

```bash
cd "/Users/ishanjuneja/Desktop/Committee Launch Game"
npm start
```

You should see:
```
╔═══════════════════════════════════════╗
║   🎮 Committee Arena Server          ║
╚═══════════════════════════════════════╝
✅ Colyseus running on ws://localhost:2567
🌐 Client available at http://localhost:2567

Ready for players to join!
```

### 2️⃣ Open Your Browser

Navigate to:
```
http://localhost:2567
```

### 3️⃣ Enter Your Name & Play!

- Enter your name when prompted
- You'll be randomly assigned to a committee
- Use the joystick (bottom-left) to move
- Use the punch button 👊 (bottom-right) to attack

## 🎮 Controls

| Control | Location | Action |
|---------|----------|--------|
| 🕹️ Joystick | Bottom-Left | Move your character |
| 👊 Punch Button | Bottom-Right | Attack nearby players |

## 👥 Multiplayer

To play with friends:

1. **Same computer**: Open multiple browser tabs at `http://localhost:2567`
2. **Same network**: Share your local IP address
   - Run `ifconfig | grep "inet "` to find your IP
   - Friends connect to `http://YOUR_IP:2567`
3. **Online**: Deploy to a cloud service (see deployment guide in README)

## 🎨 Committees

You'll be randomly assigned to one of these:

- ☕ **Coffee Chats** (Brown)
- 💼 **Professional Development** (Blue)  
- 👩‍💼 **IWAB** (Purple)

## ⚔️ Combat Rules

- Each player starts with **3 HP** (❤️❤️❤️)
- Attack range: Must be very close to your target
- When HP reaches 0, a death screen appears
- Last player standing wins!

## 🛑 Stopping the Server

Press `Ctrl + C` in the terminal where the server is running.

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Kill process on port 2567
lsof -ti:2567 | xargs kill -9
```

**Dependencies not installed?**
```bash
npm install
```

**TypeScript errors?**
```bash
npm install -D typescript ts-node
```

---

**Ready? Let the battle begin! ⚔️**

For more details, see the full [README.md](README.md)

