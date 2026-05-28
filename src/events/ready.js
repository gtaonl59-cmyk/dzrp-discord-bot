import { Events, ActivityType } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Bot online: ${client.user.tag}`);
    console.log(`📡 Serving ${client.guilds.cache.size} server(s)`);

    client.user.setPresence({
      activities: [
        {
          name: "DzRP | !help",
          type: ActivityType.Watching,
        },
      ],
      status: "online",
    });
  },
};
