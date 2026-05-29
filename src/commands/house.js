
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, createUser, removeMoney, saveUser } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("buyhouse")
    .setDescription("شراء بيت"),

  async execute(interaction) {
    let user = getUser(interaction.user.id);

    if (!user) {
      user = createUser(interaction.user.id, interaction.user.username);
    }

    const price = 1500000;

    if (user.balance < price) {
      return interaction.reply({
        content: "❌ تحتاج 1,500,000$",
        ephemeral: true
      });
    }

    removeMoney(interaction.user.id, price, "House", interaction.user.id);

    const houses = user.houses || [];
    houses.push("بيت فاخر");

    saveUser(interaction.user.id, { houses });

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("🏠 تم شراء البيت")
          .setDescription("مبروك عليك البيت")
      ]
    });
  }
};
