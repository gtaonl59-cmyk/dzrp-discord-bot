import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getUser, createUser, addMoney, removeMoney } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("حوّل أموال لعضو آخر 💸")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("المستلم").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("المبلغ (يجب أن يكون أكبر من صفر)")
        .setRequired(true)
        .setMinValue(1)
    ),

  prefix: "pay",

  async execute(interaction, _client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const result = await handlePay(interaction.user, target, amount);
    await interaction.editReply(result);
  },

  async executePrefix(message, args, _client) {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply("❌ استخدم: `!pay @عضو <مبلغ>`");
    }
    const result = await handlePay(message.author, target, amount);
    await message.reply(result);
  },
};

async function handlePay(sender, target, amount) {
  if (sender.id === target.id) {
    return { content: "❌ لا يمكنك تحويل أموال لنفسك." };
  }
  if (target.bot) {
    return { content: "❌ لا يمكنك تحويل أموال للبوت." };
  }

  let senderUser = getUser(sender.id);
  if (!senderUser) senderUser = createUser(sender.id, sender.username);

  let targetUser = getUser(target.id);
  if (!targetUser) targetUser = createUser(target.id, target.username);

  if (senderUser.balance < amount) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("❌ رصيد غير كافٍ")
          .setDescription(`رصيدك الحالي **${senderUser.balance.toLocaleString()} $** وأنت تحاول تحويل **${amount.toLocaleString()} $**`)
          .setFooter({ text: "DzRP Economy" }),
      ],
    };
  }

  removeMoney(sender.id, amount, `pay to ${target.username}`, null);
  addMoney(target.id, amount, `received from ${sender.username}`, null);

  const newSenderBal = getUser(sender.id).balance;
  const newTargetBal = getUser(target.id).balance;

  return {
    embeds: [
      new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("💸 تم التحويل بنجاح")
        .addFields(
          { name: "📤 المرسِل",    value: `<@${sender.id}>`,                         inline: true },
          { name: "📥 المستلم",   value: `<@${target.id}>`,                          inline: true },
          { name: "💵 المبلغ",    value: `**${amount.toLocaleString()} $**`,          inline: false },
          { name: "💳 رصيدك الجديد", value: `${newSenderBal.toLocaleString()} $`,    inline: true },
          { name: "💳 رصيد المستلم",  value: `${newTargetBal.toLocaleString()} $`,   inline: true },
        )
        .setFooter({ text: "DzRP Economy System" })
        .setTimestamp(),
    ],
  };
}
