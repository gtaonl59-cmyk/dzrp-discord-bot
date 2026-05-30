import { Interaction, Collection } from "discord.js";
import { errorEmbed } from "../utils/embeds.js";
import { logger } from "../../lib/logger.js";

const cooldowns = new Collection<string, Collection<string, number>>();

export default {
  name: "interactionCreate",
  async execute(interaction: Interaction, client: any) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands?.get(interaction.commandName);
    if (!command) return;

    // Cooldown handling
    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name)!;
    const cooldownAmount = (command.cooldown ?? 3) * 1000;
    const userId = interaction.user.id;

    if (timestamps.has(userId)) {
      const expirationTime = timestamps.get(userId)! + cooldownAmount;
      if (now < expirationTime) {
        const remaining = ((expirationTime - now) / 1000).toFixed(1);
        await interaction.reply({
          embeds: [errorEmbed("Cooldown", `Please wait **${remaining}s** before using \`/${command.data.name}\` again.`)],
          ephemeral: true,
        });
        return;
      }
    }
    timestamps.set(userId, now);
    setTimeout(() => timestamps.delete(userId), cooldownAmount);

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error(`Command ${interaction.commandName} error: ${err}`);
      const reply = {
        embeds: [errorEmbed("Error", "An internal error occurred. Please try again.")],
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  },
};
