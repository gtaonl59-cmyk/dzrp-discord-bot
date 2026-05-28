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

// =====================
// Collections
// =====================
client.commands = new Collection();
client.prefixCommands = new Collection();

// =====================
// Load Commands
// =====================
const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

for (const file of commandFiles) {
  const mod = await import(join(commandsPath, file));
  const command = mod.default;

  if (!command) continue;

  if (command.data) {
    client.commands.set(command.data.name, command);
  }

  if (command.prefix) {
    client.prefixCommands.set(command.prefix, command);
  }
}

// =====================
// Load Events
// =====================
const eventsPath = join(__dirname, "events");
const eventFiles = readdirSync(eventsPath).filter((f) => f.endsWith(".js"));

for (const file of eventFiles) {
  const mod = await import(join(eventsPath, file));
  const event = mod.default;

  if (!event) continue;

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// =====================
// Slash Commands Handler
// =====================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error("❌ Slash command error:", err);

    const reply = {
      content: "⚠️ خطأ في تنفيذ الأمر",
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// =====================
// Prefix Commands (!)
// =====================
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
    console.error(`❌ Prefix error (${commandName}):`, err);
    message.reply("⚠️ حدث خطأ أثناء تنفيذ الأمر");
  }
});

// =====================
// BUTTONS (VERIFY SYSTEM)
// =====================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "verify_btn") {
    const role = interaction.guild.roles.cache.find(
      (r) => r.name === "تأكيد الحساب"
    );

    if (!role) {
      return interaction.reply({
        content: "❌ رتبة تأكيد الحساب غير موجودة",
        ephemeral: true,
      });
    }

    try {
      await interaction.member.roles.add(role);

      return interaction.reply({
        content: "✅ تم تأكيد حسابك بنجاح",
        ephemeral: true,
      });
    } catch (err) {
      console.error("❌ Role error:", err);

      return interaction.reply({
        content: "❌ ما قدرتش نعطيك الرتبة",
        ephemeral: true,
      });
    }
  }
});

// =====================
// Login
// =====================
client.login(TOKEN);
