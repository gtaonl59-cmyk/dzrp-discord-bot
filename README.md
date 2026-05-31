# RP City Bot — JSON Edition

A complete Discord RP bot using **only Node.js + discord.js**.  
No database. No MongoDB. No Atlas. Just JSON files on disk.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy the example env file
cp .env.example .env

# 3. Add your bot token to .env
#    DISCORD_TOKEN=your_token_here

# 4. Run the bot
node index.js
```

That's it. Slash commands register automatically on startup.

## Requirements

- Node.js 18 or higher
- A Discord bot token ([create one here](https://discord.com/developers/applications))

## Discord Setup

1. Go to https://discord.com/developers/applications
2. Create a new application → Bot → copy your token
3. Enable **Message Content Intent** and **Server Members Intent** under Bot → Privileged Gateway Intents
4. Go to OAuth2 → URL Generator:
   - Scopes: `bot` + `applications.commands`
   - Permissions: `Administrator`
5. Use the generated URL to invite the bot to your server

## How Data Is Stored

All data is saved in the `data/` folder as JSON files:

| File | Contents |
|------|----------|
| `data/economy.json` | Wallets, banks, XP, levels |
| `data/characters.json` | RP characters per user |
| `data/jobs.json` | Current jobs |
| `data/properties.json` | Owned properties |
| `data/vehicles.json` | Owned vehicles |
| `data/gangs.json` | Gang records |
| `data/gang_members.json` | Gang membership |
| `data/prison.json` | Jail records |
| `data/vip.json` | VIP tiers |
| `data/warnings.json` | Mod warnings |

Data persists across restarts. To reset everything, delete the `data/` folder.

## Commands

| Category | Commands |
|----------|----------|
| 💰 Economy | `/balance` `/daily` `/weekly` `/work` `/rob` `/bank` `/transfer` |
| 🎭 Roleplay | `/character` `/me` `/say` `/do` `/inventory` |
| 💼 Jobs | `/job list/apply/quit/info` |
| 🏠 Property | `/property listings/buy/myproperties/sell` |
| 🚗 Vehicles | `/vehicle dealership/buy/garage/sell` |
| 💀 Gang | `/gang create/info/list/invite/kick/leave` |
| 🔒 Prison | `/prison jail/release/status/check` |
| 🎮 Fun | `/fun coinflip/dice/casino/rps/trivia` |
| 👤 Profile | `/profile` `/rank top/me` |
| 💎 VIP | `/vip info/buy/status/grant` |
| 🛡️ Mod | `/mod ban/kick/warn/warnings/timeout/purge` |
| ❓ Help | `/help` |

## Development

```bash
# Auto-restart on file changes (Node.js 18+)
npm run dev
```
