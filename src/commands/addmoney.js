import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { getUser, createUser, addMoney, removeMoney, setMoney } from "../database.js";

const ADMIN_ROLES = ["الإدارة", "Admin", "المشرف", "Moderator", "Owner"];

function isAdmin(member) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  return member.roles.cache.some((r) => ADMIN_ROLES.includes(r.name));
}

export default {
  data: new SlashCommandBuilder()
    .setName("addmoney")
    .setDescription("إضافة أو خصم أموال من عضو (مشرف فقط)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو المستهدف").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("المبلغ (سالب للخصم)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("السبب (اختياري)").setRequired(false)
    ),

  prefix: "addmoney",

  async execute(interaction, _client) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        content: "🚫 هذا الأمر للمشرفين فقط.",
        flags: MessageFlags.Ephemeral,
      });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const reason = interaction.options.getString("reason") || "بدون سبب";

    await applyMoney(interaction.user, target, amount, reason, interaction.guild, {
      reply: (opts) => interaction.editReply(opts),
    });
  },

  async executePrefix(message, args, _client) {
    if (!isAdmin(message.member)) {
      return message.reply("🚫 هذا الأمر للمشرفين فقط.");
    }

    const mentioned = message.mentions.users.first();
    const amount = parseInt(args[1]);
    const reason = args.slice(2).join(" ") || "بدون سبب";

    if (!mentioned || isNaN(amount)) {
      return message.reply("❌ استخدم: `!addmoney @عضو <مبلغ> [سبب]`");
    }

    await applyMoney(message.author, mentioned, amount, reason, message.guild, {
      reply: (opts) => message.reply(typeof opts === "string" ? opts : opts),
    });
  },
};

async function applyMoney(admin, target, amount, reason, guild, ctx) {
  let dbUser = getUser(target.id);
  if (!dbUser) dbUser = createUser(target.id, target.username);

  if (amount > 0) {
    addMoney(target.id, amount, reason, admin.id);
  } else if (amount < 0) {
    removeMoney(target.id, Math.abs(amount), reason, admin.id);
  } else {
    return ctx.reply({ content: "❌ المبلغ يجب أن يكون غير صفر." });
  }

  const newBalance = getUser(target.id).balance;
  const action = amount > 0 ? "إضافة" : "خصم";
  const color = amount > 0 ? 0x2ecc71 : 0xe74c3c;
  const emoji = amount > 0 ? "➕" : "➖";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} تم ${action} الأموال`)
    .addFields(
      { name: "👤 العضو", value: `<@${target.id}>`, inline: true },
      { name: "💵 المبلغ", value: `**${Math.abs(amount).toLocaleString()} $**`, inline: true },
      { name: "💰 الرصيد الجديد", value: `**${newBalance.toLocaleString()} $**`, inline: true },
      { name: "📝 السبب", value: reason, inline: false },
      { name: "👮 المشرف", value: `<@${admin.id}>`, inline: true }
    )
    .setFooter({ text: "DzRP Economy System" })
    .setTimestamp();

  try {
    if (guild) {
      const member = await guild.members.fetch(target.id);
      await member.send({
        embeds: [
          new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emoji} تم ${action} أموال من حسابك`)
            .setDescription(`**${Math.abs(amount).toLocaleString()} $** | السبب: ${reason}`)
            .addFields({ name: "💰 رصيدك الجديد", value: `${newBalance.toLocaleString()} $` })
            .setFooter({ text: "DzRP — إشعار مالي" })
            .setTimestamp(),
        ],
      });
    }
  } catch (_) {}

  return ctx.reply({ embeds: [embed] });
}
