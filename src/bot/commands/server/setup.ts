import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from "discord.js";
import { getOrCreateGuildSettings } from "../../utils/helpers.js";
import { successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Server setup and configuration")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName("view").setDescription("View current server settings"))
    .addSubcommand((s) =>
      s.setName("welcome").setDescription("Set welcome channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Welcome channel").setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand((s) =>
      s.setName("logs").setDescription("Set log channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Log channel").setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand((s) =>
      s.setName("tickets").setDescription("Set ticket category")
        .addChannelOption((o) => o.setName("category").setDescription("Ticket category").setRequired(true).addChannelTypes(ChannelType.GuildCategory))
    )
    .addSubcommand((s) =>
      s.setName("autorole").setDescription("Set auto role for new members")
        .addRoleOption((o) => o.setName("role").setDescription("Role to auto-assign").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("antispam").setDescription("Toggle anti-spam protection")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("antilink").setDescription("Toggle anti-link protection")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("xp").setDescription("Toggle XP system")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("economy").setDescription("Toggle economy system")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const settings = await getOrCreateGuildSettings(interaction.guildId!);

    if (sub === "view") {
      return interaction.reply({
        embeds: [
          infoEmbed("Server Settings", `Configuration for **${interaction.guild!.name}**`)
            .addFields(
              { name: "👋 Welcome Channel", value: settings.welcomeChannel ? `<#${settings.welcomeChannel}>` : "Not set", inline: true },
              { name: "📋 Log Channel", value: settings.logChannel ? `<#${settings.logChannel}>` : "Not set", inline: true },
              { name: "🎫 Ticket Category", value: settings.ticketCategory ?? "Not set", inline: true },
              { name: "🔒 Anti-Spam", value: settings.antiSpam ? "✅ On" : "❌ Off", inline: true },
              { name: "🔗 Anti-Link", value: settings.antiLink ? "✅ On" : "❌ Off", inline: true },
              { name: "🛡️ Anti-Raid", value: settings.antiRaid ? "✅ On" : "❌ Off", inline: true },
              { name: "⭐ XP System", value: settings.xpEnabled ? "✅ On" : "❌ Off", inline: true },
              { name: "💰 Economy", value: settings.economyEnabled ? "✅ On" : "❌ Off", inline: true },
              { name: "🎭 RP System", value: settings.rpEnabled ? "✅ On" : "❌ Off", inline: true },
              { name: "🏛️ Tax Rate", value: `${(settings.taxRate * 100).toFixed(1)}%`, inline: true },
              { name: "📈 Inflation", value: `${settings.inflation.toFixed(2)}x`, inline: true },
              { name: "✨ XP Multiplier", value: `${settings.xpMultiplier}x`, inline: true },
            ),
        ],
        ephemeral: true,
      });
    }

    if (sub === "welcome") {
      const channel = interaction.options.getChannel("channel", true);
      settings.welcomeChannel = channel.id;
      await settings.save();
      return interaction.reply({ embeds: [successEmbed("Welcome Channel Set", `Welcome messages will now be sent to <#${channel.id}>.`)], ephemeral: true });
    }

    if (sub === "logs") {
      const channel = interaction.options.getChannel("channel", true);
      settings.logChannel = channel.id;
      await settings.save();
      return interaction.reply({ embeds: [successEmbed("Log Channel Set", `Logs will now be sent to <#${channel.id}>.`)], ephemeral: true });
    }

    if (sub === "tickets") {
      const category = interaction.options.getChannel("category", true);
      settings.ticketCategory = category.id;
      await settings.save();
      return interaction.reply({ embeds: [successEmbed("Ticket Category Set", `Tickets will be created in the \`${category.name}\` category.`)], ephemeral: true });
    }

    if (sub === "autorole") {
      const role = interaction.options.getRole("role", true);
      if (!settings.autoRoles.includes(role.id)) settings.autoRoles.push(role.id);
      await settings.save();
      return interaction.reply({ embeds: [successEmbed("Auto Role Set", `New members will automatically receive <@&${role.id}>.`)], ephemeral: true });
    }

    if (sub === "antispam") {
      settings.antiSpam = interaction.options.getBoolean("enabled", true);
      await settings.save();
      return interaction.reply({ embeds: [successEmbed("Anti-Spam", `Anti-spam protection is now **${settings.antiSpam ? "enabled" : "disabled"}**.`)], ephemeral: true });
    }

    if (sub === "antilink") {
      settings.antiLink = interaction.options.getBoolean("enabled", true);
      await settings.save();
      return interaction.reply({ embeds: [successEmbed("Anti-Link", `Anti-link protection is now **${settings.antiLink ? "enabled" : "disabled"}**.`)], ephemeral: true });
    }

    if (sub === "xp") {
      settings.xpEnabled = interaction.options.getBoolean("enabled", true);
      await settings.save();
      return interaction.reply({ embeds: [successEmbed("XP System", `XP system is now **${settings.xpEnabled ? "enabled" : "disabled"}**.`)], ephemeral: true });
    }

    if (sub === "economy") {
      settings.economyEnabled = interaction.options.getBoolean("enabled", true);
      await settings.save();
      return interaction.reply({ embeds: [successEmbed("Economy", `Economy system is now **${settings.economyEnabled ? "enabled" : "disabled"}**.`)], ephemeral: true });
    }
  },
};
