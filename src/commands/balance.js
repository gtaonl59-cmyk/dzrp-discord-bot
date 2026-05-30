import {
  SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags
} from "discord.js";
import { getUser, createUser, getBalance } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("عرض رصيدك أو رصيد عضو آخر")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("اسم العضو (اختياري)").setRequired(false)
    ),

  prefix: "balance",

  async execute(interaction, _client) {
    const target = interaction.options.getUser("user") || interaction.user;
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let dbUser = getUser(target.id);
    if (!dbUser) dbUser = createUser(target.id, target.username);

    const embed = buildBalanceEmbed(target, dbUser);
    await interaction.editReply({ embeds: [embed] });
  },

  async executePrefix(message, args, _client) {
    const mentioned = message.mentions.users.first();
    const target = mentioned || message.author;

    let dbUser = getUser(target.id);
    if (!dbUser) dbUser = createUser(target.id, target.username);

    const embed = buildBalanceEmbed(target, dbUser);
    await message.reply({ embeds: [embed] });
  },
};

function buildBalanceEmbed(user, dbUser) {
  const verified = dbUser.verified ? `🎮 \`${dbUser.psn}\`` : "❌ غير موثق";
  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("💰 رصيد الحساب")
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: "👤 المستخدم", value: `<@${user.id}>`, inline: true },
      { name: "🎮 PSN", value: verified, inline: true },
      {
        name: "💵 الرصيد",
        value: `**${dbUser.balance.toLocaleString()} $**`,
        inline: false,
      }
    )
    .setFooter({ text: "DzRP Economy System" })
    .setTimestamp();
}
