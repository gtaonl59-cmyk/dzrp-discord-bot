import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import Character from "../../models/Character.js";
import { getOrCreateUser, isPrisoned } from "../../utils/helpers.js";
import { rpEmbed, errorEmbed, prisonEmbed } from "../../utils/embeds.js";

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("do")
    .setDescription("Describe what happens in the scene (narrative RP)")
    .addStringOption((o) => o.setName("scene").setDescription("Describe the scene").setRequired(true).setMaxLength(1000)),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);
    if (isPrisoned(user.prisonEnd)) {
      return interaction.reply({ embeds: [prisonEmbed("In Prison", "You cannot use RP commands while in prison.")], ephemeral: true });
    }

    const char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, isActive: true });
    if (!char) return interaction.reply({ embeds: [errorEmbed("No Character", "You need an active character. Use `/character create` first.")], ephemeral: true });
    if (char.isDead) return interaction.reply({ embeds: [errorEmbed("Dead", "Your character is dead.")], ephemeral: true });

    const scene = interaction.options.getString("scene", true);
    return interaction.reply({
      embeds: [
        rpEmbed("📜 Scene", `*${scene}*`)
          .setFooter({ text: `Narrated by ${char.name}` }),
      ],
    });
  },
};
