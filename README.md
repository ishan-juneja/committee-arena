# ⚔️ Committee Arena - 2D Multiplayer Game

A real-time multiplayer arena game built with Colyseus and Phaser 3, where players battle representing different committees!

## 🎮 Features

- **Real-time Multiplayer**: Powered by Colyseus WebSocket server
- **Smooth Movement**: Virtual joystick controls for mobile and desktop
- **Combat System**: Attack other players with a punch button
- **Health System**: Each player has 3 HP with visual hearts display
- **Committee Themes**: Random committee assignment with unique emojis
- **Death Screens**: Beautiful overlay when a player is defeated
- **Player Names**: Each player has a visible name label
- **Responsive Design**: Works on desktop and mobile devices

## 🏛️ Committees

- ☕ **Coffee Chats** (Brown)
- 💼 **Professional Development** (Blue)
- 👩‍💼 **IWAB** (Purple)

## 🗂️ Project Structure

```
committee-arena/
├── server/
│   ├── ArenaRoom.ts          # Game logic & Colyseus room
│   ├── schema/
│   │   ├── ArenaState.ts     # Main game state
│   │   └── PlayerState.ts    # Individual player state
│   └── index.ts              # Server bootstrap
├── client/
│   ├── index.html            # Main HTML file
│   ├── main.js               # Phaser configuration
│   ├── scenes/
│   │   └── GameScene.js      # Main game scene
│   ├── ui/
│   │   ├── Joystick.js       # Virtual joystick
│   │   └── AttackButton.js   # Attack button
│   ├── net/
│   │   └── Network.js        # Colyseus client wrapper
│   └── entities/
│       └── PlayerSprite.js   # Player visual representation
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd committee-arena
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open the game**
   Open your browser and navigate to:
   ```
   http://localhost:2567
   ```

5. **Play with friends!**
   Share the URL with friends on the same network to play together.

## 🎯 How to Play

1. **Enter Your Name**: When you join, you'll be prompted for your name
2. **Move**: Use the virtual joystick in the bottom-left corner
3. **Attack**: Press the punch button (👊) in the bottom-right corner
4. **Goal**: Reduce other players' HP to 0 while protecting your own 3 HP
5. **Win**: Be the last player standing!

## 🛠️ Development

### File Descriptions

#### Server-Side

- **`ArenaRoom.ts`**: Core game logic including movement, attacks, and damage calculation
- **`PlayerState.ts`**: Schema defining player properties (position, HP, name, etc.)
- **`ArenaState.ts`**: Schema for overall game state (collection of players)
- **`index.ts`**: Express + Colyseus server setup

#### Client-Side

- **`GameScene.js`**: Main Phaser scene that orchestrates the game
- **`PlayerSprite.js`**: Visual representation of players with HP and names
- **`Joystick.js`**: Touch-friendly movement controller
- **`AttackButton.js`**: Attack action button
- **`Network.js`**: Abstraction layer for Colyseus communication

### Clean Code Principles Applied

✅ Single Responsibility - Each file has one clear purpose  
✅ No Magic Numbers - All constants are named (PUNCH_RADIUS, etc.)  
✅ Comprehensive Comments - Every class and function documented  
✅ Modular Architecture - Components are independent and reusable  
✅ No Global Variables - Everything scoped properly  

## 🔧 Configuration

### Server Port

Change the port in `server/index.ts`:
```typescript
const PORT = process.env.PORT || 2567;
```

### Game Balance

Modify constants in `server/ArenaRoom.ts`:
```typescript
const PUNCH_RADIUS = 50;        // Attack range
const ATTACK_DURATION_MS = 300; // Attack animation length
```

### Movement Speed

Adjust in `client/net/Network.js`:
```javascript
dx: vec.x * 3, // Movement speed multiplier
dy: vec.y * 3
```

## 📦 Dependencies

### Server
- `colyseus` - Real-time multiplayer framework
- `@colyseus/schema` - State synchronization
- `express` - HTTP server
- `typescript` - Type safety
- `ts-node` - TypeScript execution

### Client
- `phaser` - 2D game framework
- `colyseus.js` - Colyseus client library

## 🐛 Troubleshooting

**Can't connect to server?**
- Make sure the server is running (`npm start`)
- Check that port 2567 is not blocked by firewall
- Ensure you're using the correct URL

**Game is laggy?**
- Check your network connection
- Reduce movement speed multiplier
- Increase server tick rate in ArenaRoom

**Players not appearing?**
- Open browser console (F12) to check for errors
- Verify WebSocket connection is established
- Check server logs for connection issues

## 📝 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🎉 Credits

Built with ❤️ using:
- [Colyseus](https://colyseus.io/) - Multiplayer Framework
- [Phaser 3](https://phaser.io/) - Game Engine
- [TypeScript](https://www.typescriptlang.org/) - Type Safety

---

**Have fun battling in the arena! ⚔️**

