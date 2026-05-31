import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure data/ folder exists on first run
const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

(async () => {
  // ── Load commands ────────────────────────────────────────────────────────
  const commandData = [];
  const commandsDir = join(__dirname, 'src', 'commands');

  function collectFiles(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) files.push(...collectFiles(full));
      else if (entry.name.endsWith('.js')) files.push(full);
    }
    return files;
  }

  for (const file of collectFiles(commandsDir)) {
    const { default: command } = await import(file);
    if (command?.data && command?.execute) {
      client.commands.set(command.data.name, command);
      commandData.push(command.data.toJSON());
    }
  }

  console.log(`📦  Loaded ${client.commands.size} commands.`);

  // ── Load events ─────────────────────────────────────────────────────────
  const eventsDir = join(__dirname, 'src', 'events');
  for (const file of readdirSync(eventsDir).filter(f => f.endsWith('.js'))) {
    const { default: event } = await import(join(eventsDir, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client, null, null, commandData));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }

  // ── Login ────────────────────────────────────────────────────────────────
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error('❌  DISCORD_TOKEN is missing. Create a .env file:\n   DISCORD_TOKEN=your_token_here');
    process.exit(1);
  }

  await client.login(token);
})();
