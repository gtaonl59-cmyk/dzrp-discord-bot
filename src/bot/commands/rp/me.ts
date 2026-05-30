import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import Character from "../../models/Character.js";
import { getOrCreateUser, isPrisoned } from "../../utils/helpers.js";
import { rpEmbed, errorEmbed, prisonEmbed } from "../../utils/embeds.js";

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("me")
    .setDescription("Perform a RP action as your character")
    .addStringOption((o) => o.setName("action").setDescription("Describe what your character does").setRequired(true).setMaxLength(500)),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);
    if (isPrisoned(user.prisonEnd)) {
      return interaction.reply({ embeds: [prisonEmbed("In Prison", "You cannot use RP commands while in prison.")], ephemeral: true });
    }

    const char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, isActive: true });
    if (!char) return interaction.reply({ embeds: [errorEmbed("No Character", "You need an active character. Use `/character create` first.")], ephemeral: true });
    if (char.isDead) return interaction.reply({ embeds: [errorEmbed("Dead", "Your character is dead and cannot perform actions.")], ephemeral: true });

    const action = interaction.options.getString("action", true);
    char.history.push({ event: action, timestamp: new Date() });
    await char.save();

    return interaction.reply({
      embeds: [
        rpEmbed(`🎭 ${char.name}`, `*${action}*`)
          .setThumbnail(char.photo || interaction.user.displayAvatarURL())
          .setFooter({ text: `${char.name} | ${char.job} | Rep: ${char.reputation}` }),
      ],
    });
  },
};
