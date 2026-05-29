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
import supabase from "./database.js";
import { createUser } from "./createUser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN is not set in environment variables.");
  process.exit(1);
}

const MESSAGE_CONTENT_ENABLED =
  process.env.MESSAGE_CONTENT_INTENT === "true";

const intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages];

if (MESSAGE_CONTENT_ENABLED) {
  intents.push(GatewayIntentBits.MessageContent);
}

const client = new Client({ intents });

client.commands = new Collection();
client.prefixCommands = new Collection();

/* =========================
   LOAD COMMANDS
========================= */
const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter((f) =>
  f.endsWith(".js")
);

for (const file of commandFiles) {
  const mod = await import(join(commandsPath, file));
  const command = mod.default;

  if (command.data) client.commands.set(command.data.name, command);
  if (command.prefix) client.prefixCommands.set(command.prefix, command);
}

/* =========================
   LOAD EVENTS
========================= */
const eventsPath = join(__dirname, "events");
const eventFiles = readdirSync(eventsPath).filter((f) =>
  f.endsWith(".js")
);

for (const file of eventFiles) {
  const mod = await import(join(eventsPath, file));
  const event = mod.default;

  if (event.once) {
    client.once(event.name, (...args) =>
      event.execute(...args, client)
    );
  } else {
    client.on(event.name, (...args) =>
      event.execute(...args, client)
    );
  }
}

/* =========================
   SLASH COMMANDS
========================= */
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  await createUser(userId);

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client, supabase);
  } catch (err) {
    console.error(err);

    const msg = {
      content: "⚠️ خطأ في تنفيذ الأمر",
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

/* =========================
   PREFIX COMMANDS (!)
========================= */
if (MESSAGE_CONTENT_ENABLED) {
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("!")) return;

    const userId = message.author.id;

    await createUser(userId);

    const args = message.content
      .slice(1)
      .trim()
      .split(/\s+/);

    const commandName = args.shift().toLowerCase();
    const command = client.prefixCommands.get(commandName);

    if (!command) return;

    try {
      await command.executePrefix(message, args, client, supabase);
    } catch (err) {
      console.error(err);
      message.reply("⚠️ خطأ في تنفيذ الأمر");
    }
  });
}

client.login(TOKEN);
