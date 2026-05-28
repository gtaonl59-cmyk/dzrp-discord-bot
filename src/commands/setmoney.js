import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { getUser, createUser, setMoney } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setmoney")
    .setDescription("تحديد رصيد عضو بقيمة معينة (مشرف فقط)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو المستهدف").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("الرصيد الجديد (يجب أن يكون صفر أو أكثر)")
        .setRequired(true)
        .setMinValue(0)
    ),

  prefix: "setmoney",

  async execute(interaction, _client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "🚫 هذا الأمر للمسؤولين فقط.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    let dbUser = getUser(target.id);
    if (!dbUser) dbUser = createUser(target.id, target.username);

    setMoney(target.id, amount, interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("⚙️ تم تحديد الرصيد")
      .addFields(
        { name: "👤 العضو", value: `<@${target.id}>`, inline: true },
        { name: "💰 الرصيد الجديد", value: `**${amount.toLocaleString()} $**`, inline: true },
        { name: "👮 المشرف", value: `<@${interaction.user.id}>`, inline: true }
      )
      .setFooter({ text: "DzRP Economy System" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },

  async executePrefix(message, args, _client) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply("🚫 هذا الأمر للمسؤولين فقط.");
    }

    const mentioned = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!mentioned || isNaN(amount) || amount < 0) {
      return message.reply("❌ استخدم: `!setmoney @عضو <مبلغ>`");
    }

    let dbUser = getUser(mentioned.id);
    if (!dbUser) dbUser = createUser(mentioned.id, mentioned.username);

    setMoney(mentioned.id, amount, message.author.id);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("⚙️ تم تحديد الرصيد")
      .addFields(
        { name: "👤 العضو", value: `<@${mentioned.id}>`, inline: true },
        { name: "💰 الرصيد الجديد", value: `**${amount.toLocaleString()} $**`, inline: true },
        { name: "👮 المشرف", value: `<@${message.author.id}>`, inline: true }
      )
      .setFooter({ text: "DzRP Economy System" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
