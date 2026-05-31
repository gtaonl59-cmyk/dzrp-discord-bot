import { REST, Routes } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  async execute(client, _a, _b, _c, commandData = []) {
    console.log(`✅  Logged in as ${client.user.tag}`);
    try {
      const rest = new REST().setToken(process.env.DISCORD_TOKEN);
      await rest.put(Routes.applicationCommands(client.user.id), { body: commandData });
      console.log(`📋  Registered ${commandData.length} slash commands globally.`);
    } catch (err) {
      console.error('❌  Failed to register commands:', err.message);
    }
  },
};
