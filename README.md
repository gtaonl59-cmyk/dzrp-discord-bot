# DzRP Discord Bot 🎮

A full-featured **GTA RP Discord bot** built with discord.js v14.  
Designed for DzRp-style Arabic servers with economy, jobs, XP ranks, PSN verification and more.

---

## Features

| Category | Commands |
|---|---|
| 🔐 Verification | `/verify`, `/profile`, `/userinfo` |
| 💰 Economy | `/balance`, `/daily`, `/work`, `/pay`, `/rob` |
| 🎭 RP System | `/setjob`, `/ranks`, `/leaderboard` |
| 👮 Admin | `/addmoney`, `/setmoney`, `/admin stats`, `/admin resetverify` |
| 📖 General | `/help` |

### RP Jobs
| Job | Emoji | Daily Salary |
|---|---|---|
| مدني (Civilian) | 🚗 | $150 |
| شرطي (Police) | 👮 | $300 |
| مسعف (Medic) | 🚑 | $280 |
| ميكانيكي (Mechanic) | 🔧 | $260 |
| تاجر (Merchant) | 🏪 | $350 |
| مهرب (Smuggler) | 💊 | $450 |
| عصابة (Gang) | 🔫 | $400 |

### XP Ranks
`مبتدئ 🌱` → `محترف ⚡` → `متقدم 🔥` → `خبير 💎` → `نجم ⭐` → `أسطورة 👑` → `إله الـRP 🌌`

---

## Setup

### 1. Prerequisites
- Node.js **v20+**
- A Discord bot application ([discord.com/developers](https://discord.com/developers/applications))

### 2. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/dzrp-discord-bot.git
cd dzrp-discord-bot
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Fill in your values in .env
```

Required variables:
| Variable | Where to find it |
|---|---|
| `DISCORD_TOKEN` | Developer Portal → Bot → Token |
| `DISCORD_CLIENT_ID` | Developer Portal → General Information → Application ID |
| `DISCORD_GUILD_ID` | Right-click your server → Copy Server ID (needs Developer Mode) |

### 4. Invite Bot to Your Server
Generate an invite URL with these scopes: `bot` + `applications.commands`

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=268519432
```

Replace `YOUR_CLIENT_ID` with your actual client ID.

### 5. Deploy Slash Commands
```bash
npm run deploy
```

Run this once (or whenever you add/change commands).

### 6. Start the Bot
```bash
npm start
```

---

## Enable Prefix Commands (`!cmd`)

By default the bot runs slash-command-only mode.  
To enable `!verify`, `!balance`, etc.:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → Your App → **Bot**
2. Under **Privileged Gateway Intents**, enable **Message Content Intent**
3. Set `MESSAGE_CONTENT_INTENT=true` in your `.env`

---

## Deploy to Render (Free)

> Data is stored in `data/dzrp.json` — use Render's **persistent disk** to keep it between restarts.

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your GitHub repo — Render will detect `render.yaml` automatically
4. Add your environment variables in the Render dashboard:
   - `DISCORD_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_GUILD_ID`
5. Click **Deploy**

The `render.yaml` in this repo configures everything automatically.

---

## Project Structure

```
dzrp-discord-bot/
├── src/
│   ├── index.js              # Entry point & event loader
│   ├── database.js           # JSON-based data store
│   ├── deploy-commands.js    # Slash command registration
│   ├── commands/
│   │   ├── verify.js         # PSN verification + role assignment
│   │   ├── balance.js        # Check balance
│   │   ├── daily.js          # Daily reward (24h cooldown)
│   │   ├── work.js           # Work for money (1h cooldown)
│   │   ├── pay.js            # Transfer money
│   │   ├── rob.js            # Rob another player (risky)
│   │   ├── profile.js        # Full RP profile card
│   │   ├── setjob.js         # Admin: assign RP job
│   │   ├── ranks.js          # XP rank table
│   │   ├── leaderboard.js    # Money & XP leaderboards
│   │   ├── userinfo.js       # Member info
│   │   ├── addmoney.js       # Admin: add/deduct money
│   │   ├── setmoney.js       # Admin: set exact balance
│   │   ├── admin.js          # Admin panel (stats, reset verify)
│   │   └── help.js           # Command list
│   └── events/
│       ├── ready.js          # Bot online event
│       ├── guildMemberAdd.js # Welcome new members
│       └── error.js          # Error handling
├── data/
│   └── dzrp.json             # Player database (auto-created)
├── .env.example              # Environment variable template
├── .gitignore
├── render.yaml               # Render deployment config
└── README.md
```

---

## Data Storage

All player data is stored in `data/dzrp.json`.  
**Back this file up regularly** when self-hosting.  
On Render, the persistent disk (`/data`) ensures data survives restarts.

---

## License

MIT — free to use and modify.
