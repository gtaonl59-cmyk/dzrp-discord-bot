import { Client, Collection, REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { logger } from "../../lib/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface BotCommand {
  data: { name: string; toJSON(): object };
  execute(interaction: any): Promise<void>;
}

export async function loadCommands(client: Client & { commands?: Collection<string, BotCommand> }) {
  client.commands = new Collection();
  const commandsPath = join(__dirname, "../commands");
  const commandFolders = readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    try {
      const commandFiles = readdirSync(folderPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
      for (const file of commandFiles) {
        try {
          const mod = await import(`${folderPath}/${file}`);
          const command: BotCommand = mod.default ?? mod;
          if (command?.data && command?.execute) {
            client.commands!.set(command.data.name, command);
            logger.info(`Loaded command: ${command.data.name}`);
          }
        } catch (err) {
          logger.error(`Failed to load command ${file}: ${err}`);
        }
      }
    } catch {
      // folder may not exist
    }
  }
}

export async function registerSlashCommands(client: Client & { commands?: Collection<string, BotCommand> }) {
  if (!process.env.DISCORD_TOKEN || !client.user?.id) return;

  const commands = Array.from(client.commands!.values()).map((cmd) => cmd.data.toJSON());
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    logger.info(`Registering ${commands.length} slash commands...`);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    logger.info("Slash commands registered successfully.");
  } catch (err) {
    logger.error(`Failed to register slash commands: ${err}`);
  }
}
