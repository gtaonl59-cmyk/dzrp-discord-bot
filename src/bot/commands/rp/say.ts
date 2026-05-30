import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import Character from "../../models/Character.js";
import { getOrCreateUser, isPrisoned } from "../../utils/helpers.js";
import { rpEmbed, errorEmbed, prisonEmbed } from "../../utils/embeds.js";

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Speak in-character as your active RP character")
    .addStringOption((o) => o.setName("message").setDescription("What your character says").setRequired(true).setMaxLength(1000)),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);
    if (isPrisoned(user.prisonEnd)) {
      return interaction.reply({ embeds: [prisonEmbed("In Prison", "You cannot use RP commands while in prison.")], ephemeral: true });
    }

    const char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, isActive: true });
    if (!char) return interaction.reply({ embeds: [errorEmbed("No Character", "Create a character first with `/character create`.")], ephemeral: true });
    if (char.isDead) return interaction.reply({ embeds: [errorEmbed("Dead", "Your character cannot speak.")], ephemeral: true });

    const msg = interaction.options.getString("message", true);
    return interaction.reply({
      embeds: [
        rpEmbed(`💬 ${char.name} says:`, `"${msg}"`)
          .setThumbnail(char.photo || interaction.user.displayAvatarURL())
          .setFooter({ text: `${char.name} | ${char.job}` }),
      ],
    });
  },
};
