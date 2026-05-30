import { Client, ActivityType } from "discord.js";
import { registerSlashCommands } from "../handlers/commandHandler.js";
import { logger } from "../../lib/logger.js";

export default {
  name: "ready",
  once: true,
  async execute(_: never, client: Client) {
    logger.info(`✅ Bot online as ${client.user?.tag}`);

    await registerSlashCommands(client as any);

    const activities = [
      { name: "🎭 RP City | /help", type: ActivityType.Playing },
      { name: "💰 Economy Active", type: ActivityType.Watching },
      { name: "🚔 Police Patrol", type: ActivityType.Playing },
      { name: "⚖️ Court in Session", type: ActivityType.Watching },
    ];

    let i = 0;
    setInterval(() => {
      const act = activities[i % activities.length];
      client.user?.setPresence({ activities: [act], status: "online" });
      i++;
    }, 15000);

    client.user?.setPresence({
      activities: [{ name: "🎭 RP City | /help", type: ActivityType.Playing }],
      status: "online",
    });

    logger.info(`Serving ${client.guilds.cache.size} guild(s)`);
  },
};
