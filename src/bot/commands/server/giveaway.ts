import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { isStaff, formatMoney, getOrCreateEconomy, addTransaction } from "../../utils/helpers.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { Colors } from "../../utils/embeds.js";

export default {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Start a giveaway [Staff only]")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption((o) => o.setName("prize").setDescription("Cash prize amount").setRequired(true).setMinValue(100))
    .addIntegerOption((o) => o.setName("duration").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(10080))
    .addStringOption((o) => o.setName("description").setDescription("Giveaway description").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!isStaff(member)) return interaction.reply({ embeds: [errorEmbed("No Permission", "You need Manage Server to start giveaways.")], ephemeral: true });

    const prize = interaction.options.getInteger("prize", true);
    const duration = interaction.options.getInteger("duration", true);
    const description = interaction.options.getString("description") ?? "React with 🎉 to enter!";
    const endsAt = new Date(Date.now() + duration * 60 * 1000);

    const embed = new EmbedBuilder()
      .setColor(Colors.gold)
      .setTitle("🎉 GIVEAWAY!")
      .setDescription(description)
      .addFields(
        { name: "💰 Prize", value: formatMoney(prize), inline: true },
        { name: "⏰ Ends", value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true },
        { name: "👤 Hosted by", value: `<@${interaction.user.id}>`, inline: true },
      )
      .setFooter({ text: "React with 🎉 to enter!" })
      .setTimestamp(endsAt);

    const msg = await interaction.channel!.send({ embeds: [embed] });
    await msg.react("🎉");

    await interaction.reply({ embeds: [successEmbed("Giveaway Started!", `Giveaway for **${formatMoney(prize)}** started! Ends <t:${Math.floor(endsAt.getTime() / 1000)}:R>.`)], ephemeral: true });

    setTimeout(async () => {
      try {
        const updatedMsg = await msg.fetch();
        const reaction = updatedMsg.reactions.cache.get("🎉");
        if (!reaction) return;

        const users = await reaction.users.fetch();
        const eligible = users.filter((u) => !u.bot);
        if (!eligible.size) {
          await msg.reply({ content: "😔 No one entered the giveaway." });
          return;
        }

        const winnerId = eligible.random()!.id;
        const winnerEco = await getOrCreateEconomy(winnerId, interaction.guildId!);
        winnerEco.wallet += prize;
        winnerEco.totalEarned += prize;
        await winnerEco.save();
        await addTransaction(winnerId, interaction.guildId!, "giveaway", prize, "Giveaway winner");

        const winEmbed = new EmbedBuilder()
          .setColor(Colors.success)
          .setTitle("🎉 Giveaway Ended!")
          .setDescription(`Congratulations <@${winnerId}>! You won **${formatMoney(prize)}**! 🎊`)
          .setTimestamp();

        await msg.reply({ embeds: [winEmbed] });
      } catch { }
    }, duration * 60 * 1000);
  },
};
