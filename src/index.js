import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  MessageFlags,
} from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN is missing");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// collections
client.commands = new Collection();
client.prefixCommands = new Collection();

// load commands
const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const mod = await import(join(commandsPath, file));
  const command = mod.default;

  if (command.data) client.commands.set(command.data.name, command);
  if (command.prefix) client.prefixCommands.set(command.prefix, command);
}

// load events
const eventsPath = join(__dirname, "events");
const eventFiles = readdirSync(eventsPath).filter(f => f.endsWith(".js"));

for (const file of eventFiles) {
  const mod = await import(join(eventsPath, file));
  const event = mod.default;

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// slash handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: "❌ Error happened",
      flags: MessageFlags.Ephemeral,
    });
  }
});

// prefix commands
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!")) return;

  const args = message.content.slice(1).trim().split(" ");
  const cmd = args.shift().toLowerCase();

  const command = client.prefixCommands.get(cmd);
  if (!command) return;

  try {
    await command.executePrefix(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply("❌ Error");
  }
});

client.login(TOKEN);
