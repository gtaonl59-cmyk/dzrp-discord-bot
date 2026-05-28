import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import {
  getUser, createUser, addMoney, addXp, setCooldown, JOBS
} from "../database.js";

const COOLDOWN_MS = 60 * 60 * 1000;
const XP_REWARD = 20;

const WORK_SCENARIOS = {
  "شرطي":   ["✅ وضعت مخالفة مرورية", "✅ أوقفت مشتبهاً به", "✅ أتممت دورية ناجحة"],
  "مسعف":   ["✅ أنقذت مريضاً في الطريق", "✅ أتممت مهمة إسعاف", "✅ تعاملت مع حادث"],
  "ميكانيكي": ["✅ أصلحت سيارة في الطريق", "✅ أتممت تصليح محرك", "✅ غيّرت إطارات"],
  "تاجر":   ["✅ بعت بضاعة بربح جيد", "✅ أبرمت صفقة ناجحة", "✅ فتحت متجرك اليوم"],
  "مهرب":   ["✅ سلّمت شحنة بنجاح", "✅ تملّصت من نقطة تفتيش", "✅ ربحت من صفقة سرية"],
  "عصابة":  ["✅ أتممت مهمة للعصابة", "✅ حصلت على غنيمة", "✅ نفّذت عملية ناجحة"],
  "مدني":   ["✅ عملت في محطة وقود", "✅ وصّلت طلبيات", "✅ قدّمت خدمة عامة"],
};

export default {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("اعمل واكسب أموال حسب وظيفتك 💼"),

  prefix: "work",

  async execute(interaction, _client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await handleWork(interaction.user);
    await interaction.editReply(result);
  },

  async executePrefix(message, _args, _client) {
    const result = await handleWork(message.author);
    await message.reply(result);
  },
};

async function handleWork(user) {
  let dbUser = getUser(user.id);
  if (!dbUser) dbUser = createUser(user.id, user.username);

  const now = Date.now();
  const lastWork = dbUser.last_work ? new Date(dbUser.last_work).getTime() : 0;
  const remaining = COOLDOWN_MS - (now - lastWork);

  if (remaining > 0) {
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("⏳ أنت تعبان! استرح قليلاً")
          .setDescription(`يمكنك العمل مجدداً بعد **${m}د ${s}ث**`)
          .setFooter({ text: "DzRP Work System" }),
      ],
    };
  }

  const job = dbUser.job || "مدني";
  const jobData = JOBS[job] || JOBS["مدني"];
  const variance = Math.floor(Math.random() * 100) - 30;
  const earned = Math.max(50, jobData.salary + variance);
  const scenarios = WORK_SCENARIOS[job] || WORK_SCENARIOS["مدني"];
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  addMoney(user.id, earned, `work as ${job}`, null);
  setCooldown(user.id, "last_work");
  const xpResult = addXp(user.id, XP_REWARD);

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`${jobData.emoji} نتيجة العمل — ${job}`)
    .setDescription(scenario)
    .addFields(
      { name: "💵 الراتب",   value: `**${earned.toLocaleString()} $**`, inline: true },
      { name: "✨ XP",       value: `**+${XP_REWARD}**`,                 inline: true },
      { name: "📊 المستوى", value: `**${xpResult.level}** ${xpResult.leveledUp ? "🎉 ترقية!" : ""}`, inline: true }
    )
    .setFooter({ text: "DzRP Work System • كل ساعة يمكنك العمل مجدداً" })
    .setTimestamp();

  return { embeds: [embed] };
}
