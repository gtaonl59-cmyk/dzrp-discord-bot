import { Client, GatewayIntentBits, Partials } from "discord.js";
import mongoose from "mongoose";
import { loadCommands } from "./handlers/commandHandler.js";
import { loadEvents } from "./handlers/eventHandler.js";

const logger = {
  info: (msg: string) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
};

export { logger };

export async function startBot() {
  const token = process.env.DISCORD_TOKEN;
  const mongoUri = process.env.MONGODB_URI;

  if (!token) { logger.error("DISCORD_TOKEN is not set."); process.exit(1); }
  if (!mongoUri) { logger.error("MONGODB_URI is not set."); process.exit(1); }

  // Connect to MongoDB with retry
  let connected = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
      logger.info("✅ MongoDB connected successfully");
      connected = true;
      break;
    } catch (err: any) {
      logger.error(`MongoDB attempt ${attempt}/5 failed: ${err?.message}`);
      if (attempt < 5) {
        logger.info("Retrying in 10 seconds...");
        await new Promise((r) => setTimeout(r, 10000));
      }
    }
  }
  if (!connected) { logger.error("Could not connect to MongoDB. Exiting."); process.exit(1); }

  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected — reconnecting..."));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
  }) as any;

  await loadCommands(client);
  await loadEvents(client);

  await client.login(token);
  logger.info("Discord bot login initiated...");

  const shutdown = async () => {
    logger.info("Shutting down...");
    client.destroy();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return client;
}

startBot().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
