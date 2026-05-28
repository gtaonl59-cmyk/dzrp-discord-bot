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
  console.error("❌ DISCORD_TOKEN is not set in environment variables.");
  process.exit(1);
}

const MESSAGE_CONTENT_ENABLED = process.env.MESSAGE_CONTENT_INTENT === "true";

const intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages];
if (MESSAGE_CONTENT_ENABLED) {
  intents.push(GatewayIntentBits.MessageContent);
  console.log("ℹ️  MessageContent intent enabled — prefix commands (!cmd) active.");
} else {
  console.log(
    "ℹ️  Running in slash-command-only mode. To enable !prefix commands,\n" +
    "   1. Go to discord.com/developers → Your App → Bot\n" +
    "   2. Enable 'Message Content Intent'\n" +
    "   3. Set env var MESSAGE_CONTENT_INTENT=true in Replit Secrets"
  );
}

const client = new Client({ intents });

client.commands = new Collection();
client.prefixCommands = new Collection();

const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

for (const file of commandFiles) {
  const mod = await import(join(commandsPath, file));
  const command = mod.default;
  if (command.data) {
    client.commands.set(command.data.name, command);
  }
  if (command.prefix) {
    client.prefixCommands.set(command.prefix, command);
  }
}

const eventsPath = join(__dirname, "events");
const eventFiles = readdirSync(eventsPath).filter((f) => f.endsWith(".js"));

for (const file of eventFiles) {
  const mod = await import(join(eventsPath, file));
  const event = mod.default;
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`❌ Error in /${interaction.commandName}:`, err);
    const msg = {
      content: "⚠️ حدث خطأ أثناء تنفيذ الأمر.",
      flags: MessageFlags.Ephemeral,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

if (MESSAGE_CONTENT_ENABLED) {
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("!")) return;

    const args = message.content.slice(1).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    try {
      await command.executePrefix(message, args, client);
    } catch (err) {
      console.error(`❌ Error in !${commandName}:`, err);
      await message.reply("⚠️ حدث خطأ أثناء تنفيذ الأمر.");
    }
  });
}

client.login(TOKEN);
