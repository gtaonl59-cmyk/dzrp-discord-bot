
import {
SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags
} from "discord.js";
import { getUser, createUser, removeMoney, saveUser } from "../database.js";

const PRICE = 4000000;

export default {
  data: new SlashCommandBuilder()
    .setName("vip")
    .setDescription("شراء VIP بـ 4 مليون"),

  async execute(interaction) {
    let user = getUser(interaction.user.id);

    if (!user) {
      user = createUser(interaction.user.id, interaction.user.username);
    }

    if (user.vip) {
      return interaction.reply({ content: "⭐ عندك VIP بالفعل", ephemeral: true });
    }

    if (user.balance < PRICE) {
      return interaction.reply({
        content: `❌ تحتاج ${PRICE.toLocaleString()}$`,
        ephemeral: true
      });
    }

    removeMoney(interaction.user.id, PRICE, "VIP", interaction.user.id);
    saveUser(interaction.user.id, { vip: true });

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("⭐ تم شراء VIP")
      .setDescription("مبروك عليك VIP");

    interaction.reply({ embeds: [embed] });
  }
};
