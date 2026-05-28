import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import {
  getUser, createUser, addMoney, addXp, setCooldown, JOBS
} from "../database.js";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const BASE_REWARD = 500;
const XP_REWARD = 50;

export default {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("استلم مكافأتك اليومية 💰"),

  prefix: "daily",

  async execute(interaction, _client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await handleDaily(interaction.user);
    await interaction.editReply(result);
  },

  async executePrefix(message, _args, _client) {
    const result = await handleDaily(message.author);
    await message.reply(result);
  },
};

async function handleDaily(user) {
  let dbUser = getUser(user.id);
  if (!dbUser) dbUser = createUser(user.id, user.username);

  const now = Date.now();
  const lastDaily = dbUser.last_daily ? new Date(dbUser.last_daily).getTime() : 0;
  const remaining = COOLDOWN_MS - (now - lastDaily);

  if (remaining > 0) {
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("⏳ لم يحن وقت المكافأة بعد")
          .setDescription(`يمكنك استلام مكافأتك بعد **${h}س ${m}د**`)
          .setFooter({ text: "DzRP Daily Reward" }),
      ],
    };
  }

  const job = dbUser.job || "مدني";
  const jobData = JOBS[job] || JOBS["مدني"];
  const bonus = jobData.salary;
  const total = BASE_REWARD + bonus;

  addMoney(user.id, total, "daily reward", null);
  setCooldown(user.id, "last_daily");
  const xpResult = addXp(user.id, XP_REWARD);

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle("💰 تم استلام المكافأة اليومية!")
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: "👤 اللاعب",       value: `<@${user.id}>`,            inline: true },
      { name: "💵 المكافأة الأساسية", value: `**${BASE_REWARD.toLocaleString()} $**`, inline: true },
      { name: `${jobData.emoji} راتب ${job}`, value: `**+${bonus.toLocaleString()} $**`, inline: true },
      { name: "🏦 الإجمالي",     value: `**${total.toLocaleString()} $**`,  inline: true },
      { name: "✨ XP مكتسب",    value: `**+${XP_REWARD} XP**`,           inline: true },
      { name: "📊 المستوى",     value: `**${xpResult.level}** ${xpResult.leveledUp ? "🎉 ترقية!" : ""}`, inline: true }
    )
    .setFooter({ text: "DzRP • تعود غداً للمكافأة التالية" })
    .setTimestamp();

  if (xpResult.leveledUp) {
    embed.setDescription(`🎉 تهانينا! وصلت إلى **المستوى ${xpResult.level}**!`);
  }

  return { embeds: [embed] };
}
