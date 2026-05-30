import {
  SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, PermissionFlagsBits, EmbedBuilder,
} from "discord.js";
import Ticket from "../../models/Ticket.js";
import { getOrCreateGuildSettings, generateId } from "../../utils/helpers.js";
import { successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
import { Colors } from "../../utils/embeds.js";

export default {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket system")
    .addSubcommand((s) =>
      s.setName("create").setDescription("Open a new support ticket")
        .addStringOption((o) =>
          o.setName("type").setDescription("Ticket type").setRequired(true)
            .addChoices(
              { name: "Support", value: "support" },
              { name: "Staff", value: "staff" },
              { name: "Purchase", value: "purchase" },
              { name: "Report", value: "report" },
            )
        )
        .addStringOption((o) => o.setName("subject").setDescription("Brief description of your issue").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("close").setDescription("Close the current ticket")
        .addStringOption((o) => o.setName("reason").setDescription("Reason for closing").setRequired(false))
    )
    .addSubcommand((s) => s.setName("list").setDescription("List your open tickets"))
    .addSubcommand((s) =>
      s.setName("add").setDescription("Add a user to this ticket")
        .addUserOption((o) => o.setName("user").setDescription("User to add").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const settings = await getOrCreateGuildSettings(interaction.guildId!);

    if (sub === "create") {
      const type = interaction.options.getString("type", true) as "support" | "staff" | "purchase" | "report";
      const subject = interaction.options.getString("subject", true);

      const openTickets = await Ticket.countDocuments({ userId: interaction.user.id, guildId: interaction.guildId, status: "open" });
      if (openTickets >= 3) {
        return interaction.reply({ embeds: [errorEmbed("Too Many Tickets", "You already have 3 open tickets. Close one before opening a new one.")], ephemeral: true });
      }

      const ticketId = generateId("TKT-");
      const icons: Record<string, string> = { support: "🎫", staff: "👮", purchase: "💳", report: "📋" };

      const guild = interaction.guild!;
      const category = settings.ticketCategory ?? null;

      const channel = await guild.channels.create({
        name: `${icons[type]}-${interaction.user.username}-${ticketId.slice(-4)}`,
        type: ChannelType.GuildText,
        parent: category ?? undefined,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ],
      });

      await Ticket.create({
        ticketId,
        guildId: interaction.guildId,
        userId: interaction.user.id,
        channelId: channel.id,
        type,
        subject,
        status: "open",
      });

      const embed = new EmbedBuilder()
        .setColor(Colors.primary)
        .setTitle(`${icons[type]} Ticket Opened — ${ticketId}`)
        .setDescription(`**Subject:** ${subject}\n\nA staff member will be with you shortly. Please describe your issue in detail.`)
        .addFields(
          { name: "🏷️ Type", value: type, inline: true },
          { name: "📅 Opened", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
        )
        .setFooter({ text: "Use /ticket close when your issue is resolved." });

      await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed] });

      if (settings.staffRoles?.length) {
        for (const roleId of settings.staffRoles) {
          await channel.permissionOverwrites.create(roleId, { ViewChannel: true, SendMessages: true }).catch(() => {});
        }
      }

      return interaction.reply({ embeds: [successEmbed("Ticket Created", `Your ticket has been opened in <#${channel.id}>.`)], ephemeral: true });
    }

    if (sub === "close") {
      const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: "open" });
      if (!ticket) return interaction.reply({ embeds: [errorEmbed("No Ticket", "This is not an open ticket channel.")], ephemeral: true });

      const reason = interaction.options.getString("reason") ?? "No reason provided";
      ticket.status = "closed";
      ticket.closedBy = interaction.user.id;
      ticket.closedAt = new Date();
      await ticket.save();

      await interaction.reply({ embeds: [successEmbed("Ticket Closed", `Ticket closed by <@${interaction.user.id}>.\n**Reason:** ${reason}`)] });

      setTimeout(async () => {
        await interaction.channel!.delete().catch(() => {});
      }, 5000);

      return;
    }

    if (sub === "list") {
      const tickets = await Ticket.find({ userId: interaction.user.id, guildId: interaction.guildId, status: "open" });
      if (!tickets.length) return interaction.reply({ embeds: [infoEmbed("No Open Tickets", "You have no open tickets.")], ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(Colors.info)
        .setTitle("🎫 Your Open Tickets")
        .setDescription(`You have **${tickets.length}** open ticket(s)`);

      for (const t of tickets) {
        embed.addFields({ name: `${t.ticketId}`, value: `Type: ${t.type} | Subject: ${t.subject} | <#${t.channelId}>` });
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "add") {
      const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: "open" });
      if (!ticket) return interaction.reply({ embeds: [errorEmbed("No Ticket", "This is not an open ticket channel.")], ephemeral: true });

      const target = interaction.options.getUser("user", true);
      await interaction.channel!.permissionOverwrites.create(target.id, { ViewChannel: true, SendMessages: true }).catch(() => {});
      return interaction.reply({ embeds: [successEmbed("User Added", `<@${target.id}> has been added to this ticket.`)] });
    }
  },
};
