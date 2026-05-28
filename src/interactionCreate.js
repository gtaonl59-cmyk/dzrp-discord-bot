import { Events } from "discord.js";

export default {
  name: Events.InteractionCreate,

  async execute(interaction) {

    if (!interaction.isButton()) return;

    if (interaction.customId === "verify_btn") {

      const role = interaction.guild.roles.cache.find(
        r => r.name === "تأكيد الحساب"
      );

      if (!role) {
        return interaction.reply({
          content: "الرتبة غير موجودة",
          ephemeral: true
        });
      }

      await interaction.member.roles.add(role);

      interaction.reply({
        content: "تم تأكيد حسابك",
        ephemeral: true
      });
    }
  }
};
