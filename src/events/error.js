import { Events } from "discord.js";

export default {
  name: Events.Error,
  once: false,
  async execute(error, _client) {
    console.error("❌ Discord client error:", error);
  },
};
