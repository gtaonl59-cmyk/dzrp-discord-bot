
import {
  SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags
} from "discord.js";
import { setRank } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setrank")
    .setDescription("تغيير Rank اللاعب")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt => opt.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(opt => opt.setName("rank").setDescription("الرانكد").setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const rank = interaction.options.getString("rank");

    setRank(user.id, rank);

    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle("🎖️ تم تغيير الرانكد")
      .setDescription(`${user} أصبح رانك: ${rank}`);

    interaction.reply({ embeds: [embed] });
  }
};
