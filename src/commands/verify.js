import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getUser, createUser, setPsn } from "../database.js";

const VERIFY_ROLE_NAME = "تأكيد الحساب";

export default {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("ربط حساب PSN الخاص بك للتحقق")
    .addStringOption((opt) =>
      opt
        .setName("psn")
        .setDescription("اسم حساب PSN الخاص بك")
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(16)
    ),

  prefix: "verify",

  async execute(interaction, _client) {
    const psnName = interaction.options.getString("psn");
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await handleVerify(interaction.user, psnName, interaction.guild, {
      reply: (opts) => interaction.editReply(opts),
    });
  },

  async executePrefix(message, args, _client) {
    const psnName = args[0];
    if (!psnName) {
      return message.reply("❌ استخدم: `!verify <اسم PSN>`");
    }
    await handleVerify(message.author, psnName, message.guild, {
      reply: (opts) => message.reply(typeof opts === "string" ? opts : opts),
    });
  },
};

async function handleVerify(user, psnName, guild, ctx) {
  const psnRegex = /^[a-zA-Z0-9_-]{3,16}$/;
  if (!psnRegex.test(psnName)) {
    return ctx.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("❌ اسم PSN غير صالح")
          .setDescription(
            "يجب أن يحتوي اسم PSN على 3-16 حرف (أحرف، أرقام، _ أو -)."
          ),
      ],
    });
  }

  let dbUser = getUser(user.id);

  if (dbUser && dbUser.verified && dbUser.psn) {
    return ctx.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf39c12)
          .setTitle("⚠️ تم التحقق مسبقاً")
          .setDescription(`حسابك مرتبط مسبقاً بـ PSN: \`${dbUser.psn}\``)
          .setFooter({ text: "تواصل مع الإدارة لتغيير الحساب" }),
      ],
    });
  }

  if (!dbUser) {
    dbUser = createUser(user.id, user.username);
  }

  setPsn(user.id, psnName);

  let roleAssigned = false;
  try {
    if (guild) {
      const role = guild.roles.cache.find((r) => r.name === VERIFY_ROLE_NAME);
      if (role) {
        const member = await guild.members.fetch(user.id);
        await member.roles.add(role);
        roleAssigned = true;
      }
    }
  } catch (err) {
    console.error("⚠️ Could not assign verify role:", err.message);
  }

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("✅ تم التحقق بنجاح!")
    .setThumbnail(
      "https://i.imgur.com/AfFp7pu.png"
    )
    .addFields(
      { name: "👤 المستخدم", value: `<@${user.id}>`, inline: true },
      { name: "🎮 PSN", value: `\`${psnName}\``, inline: true },
      {
        name: "🏷️ الرتبة",
        value: roleAssigned ? `✅ تم إضافة رتبة \`${VERIFY_ROLE_NAME}\`` : "⚠️ لم يتم العثور على الرتبة",
        inline: false,
      }
    )
    .setFooter({ text: "DzRP — نظام التحقق" })
    .setTimestamp();

  return ctx.reply({ embeds: [embed] });
}
