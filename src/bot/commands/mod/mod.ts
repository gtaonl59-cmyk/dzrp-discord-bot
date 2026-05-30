import {
  SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder
} from "discord.js";
import { getOrCreateUser, isMod } from "../../utils/helpers.js";
import { successEmbed, errorEmbed, warningEmbed } from "../../utils/embeds.js";
import { Colors } from "../../utils/embeds.js";

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Moderation commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((s) =>
      s.setName("ban").setDescription("Ban a member")
        .addUserOption((o) => o.setName("user").setDescription("User to ban").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false))
    )
    .addSubcommand((s) =>
      s.setName("kick").setDescription("Kick a member")
        .addUserOption((o) => o.setName("user").setDescription("User to kick").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false))
    )
    .addSubcommand((s) =>
      s.setName("warn").setDescription("Warn a member")
        .addUserOption((o) => o.setName("user").setDescription("User to warn").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("timeout").setDescription("Timeout a member")
        .addUserOption((o) => o.setName("user").setDescription("User to timeout").setRequired(true))
        .addIntegerOption((o) => o.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(10080))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false))
    )
    .addSubcommand((s) =>
      s.setName("unban").setDescription("Unban a user by ID")
        .addStringOption((o) => o.setName("userid").setDescription("User ID to unban").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("warnings").setDescription("View warnings for a user")
        .addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("purge").setDescription("Delete multiple messages")
        .addIntegerOption((o) => o.setName("amount").setDescription("Number of messages (1-100)").setRequired(true).setMinValue(1).setMaxValue(100))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!isMod(member)) return interaction.reply({ embeds: [errorEmbed("No Permission", "You don't have moderation permissions.")], ephemeral: true });

    if (sub === "ban") {
      const target = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      try {
        await interaction.guild!.members.ban(target.id, { reason });
        const user = await getOrCreateUser(target.id, interaction.guildId!);
        user.isBanned = true;
        await user.save();
        return interaction.reply({ embeds: [successEmbed("User Banned", `<@${target.id}> has been banned.\n**Reason:** ${reason}`)] });
      } catch {
        return interaction.reply({ embeds: [errorEmbed("Failed", "Could not ban this user.")], ephemeral: true });
      }
    }

    if (sub === "kick") {
      const target = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      const targetMember = interaction.guild!.members.cache.get(target.id);
      if (!targetMember) return interaction.reply({ embeds: [errorEmbed("Not Found", "Member not found.")], ephemeral: true });
      try {
        await targetMember.kick(reason);
        return interaction.reply({ embeds: [successEmbed("User Kicked", `<@${target.id}> has been kicked.\n**Reason:** ${reason}`)] });
      } catch {
        return interaction.reply({ embeds: [errorEmbed("Failed", "Could not kick this user.")], ephemeral: true });
      }
    }

    if (sub === "warn") {
      const target = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason", true);
      const user = await getOrCreateUser(target.id, interaction.guildId!);
      user.warnings.push({ reason, moderator: interaction.user.id, timestamp: new Date() });
      await user.save();

      return interaction.reply({
        embeds: [
          warningEmbed("User Warned", `<@${target.id}> has been warned.`)
            .addFields(
              { name: "📋 Reason", value: reason, inline: false },
              { name: "🔢 Total Warnings", value: `${user.warnings.length}`, inline: true },
              { name: "👮 Moderator", value: `<@${interaction.user.id}>`, inline: true },
            ),
        ],
      });
    }

    if (sub === "timeout") {
      const target = interaction.options.getUser("user", true);
      const minutes = interaction.options.getInteger("minutes", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      const targetMember = interaction.guild!.members.cache.get(target.id);
      if (!targetMember) return interaction.reply({ embeds: [errorEmbed("Not Found", "Member not found.")], ephemeral: true });
      try {
        await targetMember.timeout(minutes * 60 * 1000, reason);
        return interaction.reply({ embeds: [successEmbed("User Timed Out", `<@${target.id}> timed out for **${minutes} minutes**.\n**Reason:** ${reason}`)] });
      } catch {
        return interaction.reply({ embeds: [errorEmbed("Failed", "Could not timeout this user.")], ephemeral: true });
      }
    }

    if (sub === "unban") {
      const userId = interaction.options.getString("userid", true);
      try {
        await interaction.guild!.members.unban(userId);
        return interaction.reply({ embeds: [successEmbed("User Unbanned", `User \`${userId}\` has been unbanned.`)] });
      } catch {
        return interaction.reply({ embeds: [errorEmbed("Failed", "Could not unban this user. Check the ID.")], ephemeral: true });
      }
    }

    if (sub === "warnings") {
      const target = interaction.options.getUser("user", true);
      const user = await getOrCreateUser(target.id, interaction.guildId!);
      if (!user.warnings.length) return interaction.reply({ embeds: [successEmbed("No Warnings", `<@${target.id}> has no warnings.`)] });

      const embed = new EmbedBuilder()
        .setColor(Colors.warning)
        .setTitle(`⚠️ Warnings for ${target.displayName}`)
        .setDescription(`Total: **${user.warnings.length}** warnings`);
      user.warnings.slice(-10).forEach((w, i) => {
        embed.addFields({ name: `#${i + 1} — ${new Date(w.timestamp).toLocaleDateString()}`, value: `${w.reason} | By: <@${w.moderator}>` });
      });
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "purge") {
      const amount = interaction.options.getInteger("amount", true);
      try {
        const channel = interaction.channel as any;
        const deleted = await channel.bulkDelete(amount, true);
        return interaction.reply({ embeds: [successEmbed("Messages Purged", `Deleted **${deleted.size}** messages.`)], ephemeral: true });
      } catch {
        return interaction.reply({ embeds: [errorEmbed("Failed", "Could not delete messages. Messages older than 14 days cannot be bulk deleted.")], ephemeral: true });
      }
    }
  },
};
