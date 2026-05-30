import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { getOrCreateUser, isMod, formatDuration, isPrisoned } from "../../utils/helpers.js";
import { prisonEmbed, errorEmbed, successEmbed } from "../../utils/embeds.js";
import Character from "../../models/Character.js";

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("prison")
    .setDescription("Prison management commands")
    .addSubcommand((s) =>
      s.setName("jail").setDescription("Send a player to prison [Staff only]")
        .addUserOption((o) => o.setName("user").setDescription("User to jail").setRequired(true))
        .addIntegerOption((o) => o.setName("minutes").setDescription("Sentence in minutes").setRequired(true).setMinValue(1).setMaxValue(10080))
        .addStringOption((o) => o.setName("reason").setDescription("Reason for imprisonment").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("release").setDescription("Release a player from prison [Staff only]")
        .addUserOption((o) => o.setName("user").setDescription("User to release").setRequired(true))
    )
    .addSubcommand((s) => s.setName("status").setDescription("Check your prison status"))
    .addSubcommand((s) =>
      s.setName("check").setDescription("Check another player's prison status")
        .addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;

    if (sub === "jail") {
      if (!isMod(member)) return interaction.reply({ embeds: [errorEmbed("No Permission", "You need moderation permissions to jail players.")], ephemeral: true });

      const target = interaction.options.getUser("user", true);
      const minutes = interaction.options.getInteger("minutes", true);
      const reason = interaction.options.getString("reason", true);

      const targetUser = await getOrCreateUser(target.id, interaction.guildId!);
      if (isPrisoned(targetUser.prisonEnd)) {
        return interaction.reply({ embeds: [errorEmbed("Already Jailed", `<@${target.id}> is already in prison.`)], ephemeral: true });
      }

      const releaseTime = new Date(Date.now() + minutes * 60 * 1000);
      targetUser.isPrisoned = true;
      targetUser.prisonSentence = minutes;
      targetUser.prisonEnd = releaseTime;
      targetUser.prisonReason = reason;
      await targetUser.save();

      // Log criminal record
      const char = await Character.findOne({ userId: target.id, guildId: interaction.guildId, isActive: true });
      if (char) {
        char.criminalRecord.push({ crime: reason, sentence: minutes, timestamp: new Date() });
        await char.save();
      }

      await interaction.reply({
        embeds: [
          prisonEmbed("Player Jailed", `<@${target.id}> has been sent to prison.`)
            .addFields(
              { name: "👮 Jailed by", value: `<@${interaction.user.id}>`, inline: true },
              { name: "⏱️ Sentence", value: `${minutes} minutes`, inline: true },
              { name: "📋 Reason", value: reason, inline: false },
              { name: "🔓 Release", value: `<t:${Math.floor(releaseTime.getTime() / 1000)}:R>`, inline: true },
            ),
        ],
      });

      // Auto release
      setTimeout(async () => {
        targetUser.isPrisoned = false;
        targetUser.prisonEnd = null;
        await targetUser.save();
      }, minutes * 60 * 1000);

      return;
    }

    if (sub === "release") {
      if (!isMod(member)) return interaction.reply({ embeds: [errorEmbed("No Permission", "You need moderation permissions.")], ephemeral: true });

      const target = interaction.options.getUser("user", true);
      const targetUser = await getOrCreateUser(target.id, interaction.guildId!);
      if (!isPrisoned(targetUser.prisonEnd)) {
        return interaction.reply({ embeds: [errorEmbed("Not in Prison", `<@${target.id}> is not in prison.`)], ephemeral: true });
      }

      targetUser.isPrisoned = false;
      targetUser.prisonEnd = null;
      await targetUser.save();

      return interaction.reply({ embeds: [successEmbed("Released", `<@${target.id}> has been released from prison early.`)] });
    }

    if (sub === "status") {
      const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);
      if (!isPrisoned(user.prisonEnd)) {
        return interaction.reply({ embeds: [successEmbed("Free", "You are not in prison. Stay out of trouble!🕊️")], ephemeral: true });
      }

      return interaction.reply({
        embeds: [
          prisonEmbed("You Are In Prison", "You are currently serving time.")
            .addFields(
              { name: "📋 Reason", value: user.prisonReason, inline: false },
              { name: "⏱️ Sentence", value: `${user.prisonSentence} minutes`, inline: true },
              { name: "🔓 Release", value: `<t:${Math.floor(user.prisonEnd!.getTime() / 1000)}:R>`, inline: true },
            )
            .setFooter({ text: "While in prison: you cannot work, earn money, use RP commands, buy property, or buy vehicles." }),
        ],
        ephemeral: true,
      });
    }

    if (sub === "check") {
      const target = interaction.options.getUser("user", true);
      const targetUser = await getOrCreateUser(target.id, interaction.guildId!);
      if (!isPrisoned(targetUser.prisonEnd)) {
        return interaction.reply({ embeds: [successEmbed("Not in Prison", `<@${target.id}> is free.`)] });
      }

      return interaction.reply({
        embeds: [
          prisonEmbed(`${target.displayName}'s Prison Status`, "Currently incarcerated")
            .addFields(
              { name: "📋 Reason", value: targetUser.prisonReason, inline: false },
              { name: "⏱️ Sentence", value: `${targetUser.prisonSentence} minutes`, inline: true },
              { name: "🔓 Release", value: `<t:${Math.floor(targetUser.prisonEnd!.getTime() / 1000)}:R>`, inline: true },
            ),
        ],
      });
    }
  },
};
