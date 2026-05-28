import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getUser, createUser, addMoney, removeMoney, setCooldown } from "../database.js";

const COOLDOWN_MS = 2 * 60 * 60 * 1000;
const SUCCESS_RATE = 0.45;
const MIN_STEAL_PCT = 0.05;
const MAX_STEAL_PCT = 0.25;
const MIN_TARGET_BALANCE = 200;

export default {
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("حاول سرقة عضو آخر 🔫 (خطر!)")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("الضحية").setRequired(true)
    ),

  prefix: "rob",

  async execute(interaction, _client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser("user");
    const result = await handleRob(interaction.user, target);
    await interaction.editReply(result);
  },

  async executePrefix(message, args, _client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ استخدم: `!rob @عضو`");
    const result = await handleRob(message.author, target);
    await message.reply(result);
  },
};

async function handleRob(robber, target) {
  if (robber.id === target.id) return { content: "❌ لا يمكنك سرقة نفسك!" };
  if (target.bot) return { content: "❌ لا يمكنك سرقة البوت." };

  let robberUser = getUser(robber.id);
  if (!robberUser) robberUser = createUser(robber.id, robber.username);

  let targetUser = getUser(target.id);
  if (!targetUser) targetUser = createUser(target.id, target.username);

  const now = Date.now();
  const lastRob = robberUser.last_rob ? new Date(robberUser.last_rob).getTime() : 0;
  const remaining = COOLDOWN_MS - (now - lastRob);

  if (remaining > 0) {
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("⏳ أنت في حالة هروب!")
          .setDescription(`اختبئ لـ **${h}س ${m}د** قبل أن تسرق مجدداً`)
          .setFooter({ text: "DzRP Rob System" }),
      ],
    };
  }

  if (targetUser.balance < MIN_TARGET_BALANCE) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0x95a5a6)
          .setTitle("😂 الضحية مفلسة!")
          .setDescription(`<@${target.id}> ليس لديه ما يكفي للسرقة (${targetUser.balance.toLocaleString()} $)`)
          .setFooter({ text: "DzRP Rob System" }),
      ],
    };
  }

  setCooldown(robber.id, "last_rob");
  const success = Math.random() < SUCCESS_RATE;

  if (success) {
    const pct = MIN_STEAL_PCT + Math.random() * (MAX_STEAL_PCT - MIN_STEAL_PCT);
    const stolen = Math.max(100, Math.floor(targetUser.balance * pct));
    removeMoney(target.id, stolen, `robbed by ${robber.username}`, null);
    addMoney(robber.id, stolen, `robbed ${target.username}`, null);

    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("🔫 نجحت السرقة!")
          .setDescription(`سرقت **${stolen.toLocaleString()} $** من <@${target.id}>!`)
          .addFields(
            { name: "💰 المسروق",     value: `${stolen.toLocaleString()} $`,                    inline: true },
            { name: "💳 رصيدك الجديد", value: `${getUser(robber.id).balance.toLocaleString()} $`, inline: true },
          )
          .setFooter({ text: "DzRP Rob System • الجريمة لا تفيد دائماً" })
          .setTimestamp(),
      ],
    };
  } else {
    const fine = Math.floor(robberUser.balance * 0.1);
    if (fine > 0) removeMoney(robber.id, fine, "rob failed fine", null);

    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0x2c3e50)
          .setTitle("🚔 تم إيقافك من الشرطة!")
          .setDescription(`فشلت محاولة السرقة من <@${target.id}> وتم تغريمك!`)
          .addFields(
            { name: "💸 الغرامة",     value: `**-${fine.toLocaleString()} $**`,                  inline: true },
            { name: "💳 رصيدك الجديد", value: `${getUser(robber.id).balance.toLocaleString()} $`, inline: true },
          )
          .setFooter({ text: "DzRP Rob System • ليس كل الأيام سواء" })
          .setTimestamp(),
      ],
    };
  }
}
