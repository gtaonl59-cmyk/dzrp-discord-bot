import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { getOrCreateGuildSettings } from "../../utils/helpers.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { Colors } from "../../utils/embeds.js";

export default {
  cooldown: 30,
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Submit a suggestion for the server")
    .addStringOption((o) => o.setName("suggestion").setDescription("Your suggestion").setRequired(true).setMaxLength(1000)),

  async execute(interaction: ChatInputCommandInteraction) {
    const suggestion = interaction.options.getString("suggestion", true);
    const settings = await getOrCreateGuildSettings(interaction.guildId!);

    if (!settings.suggestionChannel) {
      return interaction.reply({ embeds: [errorEmbed("Not Configured", "The suggestion channel has not been set up. Ask an admin to use `/setup` to configure it.")], ephemeral: true });
    }

    const channel = interaction.guild!.channels.cache.get(settings.suggestionChannel) as any;
    if (!channel) return interaction.reply({ embeds: [errorEmbed("Channel Not Found", "The suggestion channel no longer exists.")], ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(Colors.info)
      .setTitle("💡 New Suggestion")
      .setDescription(suggestion)
      .addFields(
        { name: "👤 Submitted by", value: `<@${interaction.user.id}>`, inline: true },
        { name: "📅 Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: `User ID: ${interaction.user.id}` })
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await msg.react("✅");
    await msg.react("❌");

    return interaction.reply({ embeds: [successEmbed("Suggestion Submitted", `Your suggestion has been sent to <#${settings.suggestionChannel}>!`)], ephemeral: true });
  },
};
