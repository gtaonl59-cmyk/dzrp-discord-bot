import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { logger } from "../../lib/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadEvents(client: Client) {
  const eventsPath = join(__dirname, "../events");
  let eventFiles: string[] = [];
  try {
    eventFiles = readdirSync(eventsPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
  } catch {
    return;
  }

  for (const file of eventFiles) {
    try {
      const mod = await import(`${eventsPath}/${file}`);
      const event = mod.default ?? mod;
      if (event?.name) {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args, client));
        } else {
          client.on(event.name, (...args) => event.execute(...args, client));
        }
        logger.info(`Loaded event: ${event.name}`);
      }
    } catch (err) {
      logger.error(`Failed to load event ${file}: ${err}`);
    }
  }
}
