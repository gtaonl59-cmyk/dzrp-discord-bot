
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, createUser } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("wanted")
    .setDescription("عرض الونتد"),

  async execute(interaction) {
    let user = getUser(interaction.user.id);

    if (!user) {
      user = createUser(interaction.user.id, interaction.user.username);
    }

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("🔫 الونتد")
          .setDescription(`مستوى الونتد: ${user.wanted || 0}`)
      ]
    });
  }
};
