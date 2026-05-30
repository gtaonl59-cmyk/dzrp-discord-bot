
import {
 SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags
} from "discord.js";
import { addXP, getUser } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("addxp")
    .setDescription("إضافة XP للاعب")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt => opt.setName("user").setDescription("العضو").setRequired(true))
    .addIntegerOption(opt => opt.setName("amount").setDescription("الكمية").setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    addXP(user.id, amount);

    const data = getUser(user.id);

    const embed = new EmbedBuilder()
      .setColor(0x00ff99)
      .setTitle("🧠 XP تمت إضافته")
      .setDescription(`تم إضافة ${amount} XP إلى ${user}`)
      .addFields(
        { name: "XP الحالي", value: `${data.xp}`, inline: true },
        { name: "Level", value: `${data.level}`, inline: true }
      );

    interaction.reply({ embeds: [embed] });
  }
};
