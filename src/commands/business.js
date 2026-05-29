
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, createUser, saveUser } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("business")
    .setDescription("إنشاء شركة")
    .addStringOption(o =>
      o.setName("name")
       .setDescription("اسم الشركة")
       .setRequired(true)
    ),

  async execute(interaction) {
    let user = getUser(interaction.user.id);

    if (!user) {
      user = createUser(interaction.user.id, interaction.user.username);
    }

    const name = interaction.options.getString("name");

    saveUser(interaction.user.id, {
      business: name
    });

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle("🏢 تم إنشاء شركة")
          .setDescription(`اسم الشركة: ${name}`)
      ]
    });
  }
};
