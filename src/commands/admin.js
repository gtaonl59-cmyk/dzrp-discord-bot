import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { getAllUsers } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("لوحة تحكم المشرف (مشرف فقط)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("stats").setDescription("عرض إحصائيات السيرفر")
    )
    .addSubcommand((sub) =>
      sub
        .setName("resetverify")
        .setDescription("إعادة تعيين تحقق عضو")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("العضو").setRequired(true)
        )
    ),

  async execute(interaction, _client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "🚫 هذا الأمر للمسؤولين فقط.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (sub === "stats") {
      const users = getAllUsers();
      const verified = users.filter((u) => u.verified).length;
      const totalMoney = users.reduce((sum, u) => sum + u.balance, 0);

      const embed = new EmbedBuilder()
        .setColor(0x8e44ad)
        .setTitle("📊 إحصائيات DzRP")
        .addFields(
          { name: "👥 إجمالي المستخدمين", value: `${users.length}`, inline: true },
          { name: "✅ الموثقون", value: `${verified}`, inline: true },
          { name: "❌ غير الموثقين", value: `${users.length - verified}`, inline: true },
          {
            name: "💰 إجمالي الأموال في الاقتصاد",
            value: `${totalMoney.toLocaleString()} $`,
            inline: false,
          }
        )
        .setFooter({ text: "DzRP Admin Panel" })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === "resetverify") {
      const target = interaction.options.getUser("user");
      const { resetVerify } = await import("../database.js");
      resetVerify(target.id);

      try {
        const guild = interaction.guild;
        const role = guild.roles.cache.find((r) => r.name === "تأكيد الحساب");
        if (role) {
          const member = await guild.members.fetch(target.id);
          await member.roles.remove(role);
        }
      } catch (_) {}

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle("🔄 تم إعادة تعيين التحقق")
            .setDescription(`تم إلغاء تحقق <@${target.id}> بنجاح.`)
            .setFooter({ text: "DzRP Admin Panel" })
            .setTimestamp(),
        ],
      });
    }
  },
};
