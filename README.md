# RP City Discord Bot

A complete, professional Discord Roleplay Bot with economy, RP characters, jobs, properties, vehicles, gangs, prison, VIP tiers, moderation, tickets, and more.

## Features

| System | Commands |
|--------|----------|
| 🎭 Roleplay | `/character` (create/list/view/switch/edit/delete), `/me`, `/say`, `/do` |
| 💰 Economy | `/balance`, `/daily`, `/weekly`, `/monthly`, `/bank`, `/transfer`, `/work`, `/rob`, `/transactions` |
| 📦 Inventory | `/inventory` (view/shop/buy/drop) |
| 💼 Jobs | `/job` (list/apply/quit/info) — 13 jobs |
| 🏠 Property | `/property` (listings/buy/myproperties/sell) |
| 🚗 Vehicles | `/vehicle` (dealership/buy/garage/sell/register/insure) |
| 💀 Gang/Mafia | `/gang` (create/info/invite/kick/leave/disband/list) |
| 🔒 Prison | `/prison` (jail/release/status/check) |
| 💎 VIP | `/vip` (info/buy/status/grant) — 5 tiers |
| 👤 Profile | `/profile`, `/rank` (me/top) |
| 🎮 Fun | `/fun` (coinflip/dice/casino/wheel/trivia/rps) |
| 🛡️ Mod | `/mod` (ban/kick/warn/timeout/unban/warnings/purge) |
| 🎫 Tickets | `/ticket` (create/close/list/add) |
| ⚙️ Server | `/setup`, `/suggest`, `/giveaway`, `/help` |

## Setup

### 1. Create Discord Application
1. Go to https://discord.com/developers/applications → New Application → Bot
2. Copy your **Bot Token**
3. Enable **Message Content Intent** and **Server Members Intent** under Bot → Privileged Gateway Intents
4. Invite bot: OAuth2 → URL Generator → scopes: `bot` + `applications.commands` → permissions: `Administrator`

### 2. Set Up MongoDB Atlas
1. Create free cluster at https://cloud.mongodb.com
2. **Database Access** → Add user → set a simple username + password (letters/numbers only)
3. **Network Access** → Add IP → Allow Access from Anywhere (`0.0.0.0/0`)
4. **Connect** → Drivers → copy the connection string
5. Replace `<password>` in the URI with your actual password

> **Important:** If your password contains special characters (`?`, `@`, `#`, `!`, `/`), URL-encode them:
> `?` → `%3F` | `@` → `%40` | `#` → `%23` | `!` → `%21`

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your actual DISCORD_TOKEN and MONGODB_URI
```

### 4. Install & Run

**For development (TypeScript, hot reload):**
```bash
npm install
npm run dev
```

**For production (compiled JS):**
```bash
npm install
npm run build
npm start
```

Slash commands are automatically registered globally when the bot starts.

## Running 24/7

### Option A — Railway (recommended, free tier available)
1. Push code to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Add environment variables: `DISCORD_TOKEN` and `MONGODB_URI`

### Option B — VPS / Server
```bash
npm install -g pm2
npm run build
pm2 start dist/bot/index.js --name rpcity-bot
pm2 save
pm2 startup
```

### Option C — Replit
1. Upload this project to Replit
2. Add `DISCORD_TOKEN` and `MONGODB_URI` to Replit Secrets
3. Run `npm run dev`

## File Structure

```
src/
├── bot/
│   ├── index.ts              # Entry point
│   ├── commands/
│   │   ├── economy/          # balance, daily, weekly, monthly, bank, transfer, work, rob, transactions
│   │   ├── rp/               # character, me, say, do, inventory
│   │   ├── jobs/             # job
│   │   ├── property/         # property
│   │   ├── vehicle/          # vehicle
│   │   ├── gang/             # gang
│   │   ├── prison/           # prison
│   │   ├── mod/              # mod
│   │   ├── profile/          # profile, rank
│   │   ├── vip/              # vip
│   │   ├── tickets/          # ticket
│   │   ├── fun/              # fun
│   │   └── server/           # setup, suggest, giveaway, help
│   ├── events/               # ready, interactionCreate, guildMemberAdd, messageCreate
│   ├── handlers/             # commandHandler, eventHandler
│   ├── models/               # Mongoose schemas
│   └── utils/                # helpers, embeds
└── lib/
    └── logger.ts
```

## License
MIT
