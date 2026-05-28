import { Events, EmbedBuilder } from "discord.js";
import { createUser } from "../database.js";

export default {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member, _client) {
    createUser(member.id, member.user.username);

    const welcomeChannel = member.guild.channels.cache.find(
      (ch) =>
        ch.name === "الترحيب" ||
        ch.name === "welcome" ||
        ch.name === "ترحيب" ||
        ch.name === "general"
    );

    if (!welcomeChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🎉 عضو جديد!")
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setDescription(
        `مرحباً <@${member.id}> في **${member.guild.name}**!\n\n` +
          `استخدم \`/verify\` أو \`!verify <اسم PSN>\` للتحقق من حسابك.\n` +
          `أو اكتب \`!help\` لعرض جميع الأوامر.`
      )
      .addFields({
        name: "👥 عدد الأعضاء",
        value: `${member.guild.memberCount}`,
        inline: true,
      })
      .setFooter({ text: "DzRP — أهلاً بك في مجتمعنا" })
      .setTimestamp();

    await welcomeChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
