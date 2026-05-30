import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import Gang from "../../models/Gang.js";
import Economy from "../../models/Economy.js";
import { getOrCreateUser, isPrisoned, generateId, formatMoney } from "../../utils/helpers.js";
import { gangEmbed, errorEmbed, successEmbed, prisonEmbed } from "../../utils/embeds.js";

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("gang")
    .setDescription("Gang and mafia management")
    .addSubcommand((s) =>
      s.setName("create").setDescription("Create a gang or mafia")
        .addStringOption((o) => o.setName("name").setDescription("Gang name").setRequired(true))
        .addStringOption((o) =>
          o.setName("type").setDescription("Type").setRequired(true)
            .addChoices({ name: "Gang", value: "gang" }, { name: "Mafia", value: "mafia" })
        )
    )
    .addSubcommand((s) => s.setName("info").setDescription("View your gang info"))
    .addSubcommand((s) =>
      s.setName("invite").setDescription("Invite a member")
        .addUserOption((o) => o.setName("user").setDescription("User to invite").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("kick").setDescription("Kick a member")
        .addUserOption((o) => o.setName("user").setDescription("User to kick").setRequired(true))
    )
    .addSubcommand((s) => s.setName("leave").setDescription("Leave your gang"))
    .addSubcommand((s) => s.setName("disband").setDescription("Disband your gang (leader only)"))
    .addSubcommand((s) => s.setName("list").setDescription("List all gangs on the server")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);

    if (isPrisoned(user.prisonEnd) && ["create", "invite", "kick"].includes(sub)) {
      return interaction.reply({ embeds: [prisonEmbed("In Prison", "You cannot manage a gang while in prison.")], ephemeral: true });
    }

    if (sub === "create") {
      const existingMembership = await Gang.findOne({ guildId: interaction.guildId, "members.userId": interaction.user.id });
      if (existingMembership) return interaction.reply({ embeds: [errorEmbed("Already in Gang", "You are already in a gang. Leave it first.")], ephemeral: true });

      const name = interaction.options.getString("name", true);
      const type = interaction.options.getString("type", true) as "gang" | "mafia";

      const nameTaken = await Gang.findOne({ guildId: interaction.guildId, name: { $regex: `^${name}$`, $options: "i" } });
      if (nameTaken) return interaction.reply({ embeds: [errorEmbed("Name Taken", "A gang with that name already exists.")], ephemeral: true });

      const cost = 10000;
      const eco = await Economy.findOne({ userId: interaction.user.id, guildId: interaction.guildId });
      if (!eco || eco.wallet < cost) return interaction.reply({ embeds: [errorEmbed("Insufficient Funds", `Creating a gang costs **${formatMoney(cost)}**.`)], ephemeral: true });
      eco.wallet -= cost;
      await eco.save();

      const gangId = generateId("GANG-");
      const gang = await Gang.create({
        gangId,
        guildId: interaction.guildId,
        name,
        type,
        leaderId: interaction.user.id,
        members: [{ userId: interaction.user.id, rank: "Boss", joinedAt: new Date() }],
      });

      return interaction.reply({
        embeds: [
          gangEmbed(`${type === "mafia" ? "🤵" : "💀"} ${type.toUpperCase()} Created!`, `**${name}** has been established!`)
            .addFields(
              { name: "👑 Leader", value: `<@${interaction.user.id}>`, inline: true },
              { name: "🏷️ Type", value: type.charAt(0).toUpperCase() + type.slice(1), inline: true },
              { name: "💰 Registration Fee", value: formatMoney(cost), inline: true },
            ),
        ],
      });
    }

    if (sub === "info") {
      const gang = await Gang.findOne({ guildId: interaction.guildId, "members.userId": interaction.user.id });
      if (!gang) return interaction.reply({ embeds: [errorEmbed("No Gang", "You are not in a gang.")], ephemeral: true });

      const embed = gangEmbed(gang.name, gang.description || "No description set")
        .addFields(
          { name: "👑 Leader", value: `<@${gang.leaderId}>`, inline: true },
          { name: "👥 Members", value: `${gang.members.length}`, inline: true },
          { name: "💰 Balance", value: formatMoney(gang.balance), inline: true },
          { name: "🏆 Ranking", value: `#${gang.ranking}`, inline: true },
          { name: "🗺️ Territory", value: gang.territory.length ? gang.territory.join(", ") : "None", inline: true },
          { name: "💼 Daily Income", value: formatMoney(gang.income), inline: true },
        );

      const memberList = gang.members.slice(0, 10).map((m) => `<@${m.userId}> — **${m.rank}**`).join("\n");
      embed.addFields({ name: "📋 Members (Top 10)", value: memberList || "None" });
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "invite") {
      const target = interaction.options.getUser("user", true);
      const gang = await Gang.findOne({ guildId: interaction.guildId, leaderId: interaction.user.id });
      if (!gang) return interaction.reply({ embeds: [errorEmbed("Not Leader", "You must be the gang leader to invite members.")], ephemeral: true });

      const alreadyIn = await Gang.findOne({ guildId: interaction.guildId, "members.userId": target.id });
      if (alreadyIn) return interaction.reply({ embeds: [errorEmbed("Already in Gang", `<@${target.id}> is already in a gang.`)], ephemeral: true });

      gang.members.push({ userId: target.id, rank: "Recruit", joinedAt: new Date() });
      await gang.save();
      return interaction.reply({ embeds: [successEmbed("Member Invited", `<@${target.id}> has joined **${gang.name}** as a Recruit.`)] });
    }

    if (sub === "kick") {
      const target = interaction.options.getUser("user", true);
      const gang = await Gang.findOne({ guildId: interaction.guildId, leaderId: interaction.user.id });
      if (!gang) return interaction.reply({ embeds: [errorEmbed("Not Leader", "Only the gang leader can kick members.")], ephemeral: true });
      if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed("Invalid", "You cannot kick yourself.")], ephemeral: true });

      gang.members = gang.members.filter((m) => m.userId !== target.id) as typeof gang.members;
      await gang.save();
      return interaction.reply({ embeds: [successEmbed("Member Kicked", `<@${target.id}> was kicked from **${gang.name}**.`)] });
    }

    if (sub === "leave") {
      const gang = await Gang.findOne({ guildId: interaction.guildId, "members.userId": interaction.user.id });
      if (!gang) return interaction.reply({ embeds: [errorEmbed("No Gang", "You are not in a gang.")], ephemeral: true });
      if (gang.leaderId === interaction.user.id) return interaction.reply({ embeds: [errorEmbed("Leader", "Leaders cannot leave. Use `/gang disband` to disband the gang.")], ephemeral: true });

      gang.members = gang.members.filter((m) => m.userId !== interaction.user.id) as typeof gang.members;
      await gang.save();
      return interaction.reply({ embeds: [successEmbed("Left Gang", `You have left **${gang.name}**.`)] });
    }

    if (sub === "disband") {
      const gang = await Gang.findOne({ guildId: interaction.guildId, leaderId: interaction.user.id });
      if (!gang) return interaction.reply({ embeds: [errorEmbed("Not Leader", "You are not the leader of any gang.")], ephemeral: true });
      await gang.deleteOne();
      return interaction.reply({ embeds: [successEmbed("Gang Disbanded", `**${gang.name}** has been disbanded.`)] });
    }

    if (sub === "list") {
      const gangs = await Gang.find({ guildId: interaction.guildId }).sort({ ranking: -1 }).limit(10);
      if (!gangs.length) return interaction.reply({ embeds: [errorEmbed("No Gangs", "No gangs have been created yet.")], ephemeral: true });

      const embed = gangEmbed("💀 Server Gangs", `Top ${gangs.length} gangs`);
      gangs.forEach((g, i) => {
        embed.addFields({ name: `#${i + 1} ${g.name}`, value: `Leader: <@${g.leaderId}> | Members: ${g.members.length} | Type: ${g.type}` });
      });
      return interaction.reply({ embeds: [embed] });
    }
  },
};
