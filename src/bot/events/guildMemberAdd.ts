import { GuildMember, EmbedBuilder } from "discord.js";
import { getOrCreateUser, getOrCreateEconomy, getOrCreateGuildSettings } from "../utils/helpers.js";
import { logger } from "../../lib/logger.js";

export default {
  name: "guildMemberAdd",
  async execute(member: GuildMember) {
    try {
      await getOrCreateUser(member.id, member.guild.id);
      await getOrCreateEconomy(member.id, member.guild.id);

      const settings = await getOrCreateGuildSettings(member.guild.id);

      // Auto roles
      if (settings.autoRoles?.length) {
        for (const roleId of settings.autoRoles) {
          const role = member.guild.roles.cache.get(roleId);
          if (role) await member.roles.add(role).catch(() => {});
        }
      }

      // Welcome message
      if (settings.welcomeChannel) {
        const channel = member.guild.channels.cache.get(settings.welcomeChannel) as any;
        if (channel) {
          const msg = settings.welcomeMessage
            .replace("{user}", `<@${member.id}>`)
            .replace("{server}", member.guild.name)
            .replace("{count}", member.guild.memberCount.toString());

          const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("👋 Welcome to the Server!")
            .setDescription(msg)
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .addFields(
              { name: "👤 User", value: `${member.user.tag}`, inline: true },
              { name: "📅 Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
              { name: "👥 Members", value: `#${member.guild.memberCount}`, inline: true }
            )
            .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() ?? undefined })
            .setTimestamp();

          await channel.send({ embeds: [embed] });
        }
      }
    } catch (err) {
      logger.error(`guildMemberAdd error: ${err}`);
    }
  },
};
