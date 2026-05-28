import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض قائمة الأوامر المتاحة 📖"),

  prefix: "help",

  async execute(interaction, _client) {
    const embed = buildHelp();
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },

  async executePrefix(message, _args, _client) {
    const embed = buildHelp();
    await message.reply({ embeds: [embed] });
  },
};

function buildHelp() {
  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("📖 قائمة أوامر DzRP Bot")
    .setDescription("جميع الأوامر تعمل بـ `/أمر` أو `!أمر`")
    .addFields(
      {
        name: "🔐 التحقق والملف الشخصي",
        value: [
          "`/verify <psn>` — ربط حساب PSN والحصول على رتبة التحقق",
          "`/profile [@عضو]` — بطاقة RP كاملة (وظيفة، مستوى، رصيد)",
          "`/userinfo [@عضو]` — معلومات العضو",
        ].join("\n"),
      },
      {
        name: "💰 الاقتصاد",
        value: [
          "`/balance [@عضو]` — عرض الرصيد",
          "`/daily` — استلام المكافأة اليومية 💵 (كل 24 ساعة)",
          "`/work` — اعمل واكسب مالاً حسب وظيفتك 💼 (كل ساعة)",
          "`/pay @عضو <مبلغ>` — تحويل أموال لعضو آخر 💸",
          "`/rob @عضو` — محاولة سرقة عضو 🔫 (خطر! كل ساعتين)",
        ].join("\n"),
      },
      {
        name: "📊 الرتب والـ RP",
        value: [
          "`/ranks` — جدول الرتب وأعلى اللاعبين XP",
          "`/leaderboard [money|xp]` — قائمة المتصدرين",
        ].join("\n"),
      },
      {
        name: "👮 أوامر المشرفين",
        value: [
          "`/addmoney @عضو <مبلغ> [سبب]` — إضافة/خصم أموال",
          "`/setmoney @عضو <مبلغ>` — تحديد الرصيد",
          "`/setjob @عضو <وظيفة>` — تعيين وظيفة RP",
          "`/admin stats` — إحصائيات السيرفر",
          "`/admin resetverify @عضو` — إعادة تعيين التحقق",
        ].join("\n"),
      }
    )
    .setFooter({ text: "DzRP Bot • نظام GTA RP متكامل" })
    .setTimestamp();
}
