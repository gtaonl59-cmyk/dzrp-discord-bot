
import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { saveUser } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("jail")
    .setDescription("سجن لاعب")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(o =>
      o.setName("user")
       .setDescription("اللاعب")
       .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutes")
       .setDescription("المدة")
       .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const minutes = interaction.options.getInteger("minutes");

    saveUser(user.id, {
      jail: {
        jailed: true,
        reason: "Admin Jail",
        time: minutes
      }
    });

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x95a5a6)
          .setTitle("🚔 تم سجن اللاعب")
          .setDescription(`${user} دخل للحبس ${minutes} دقيقة`)
      ]
    });
  }
};
