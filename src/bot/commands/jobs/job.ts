import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, isPrisoned, JOBS } from "../../utils/helpers.js";
import { rpEmbed, errorEmbed, successEmbed, prisonEmbed } from "../../utils/embeds.js";
import Character from "../../models/Character.js";

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("job")
    .setDescription("Manage your job")
    .addSubcommand((s) => s.setName("list").setDescription("View all available jobs"))
    .addSubcommand((s) =>
      s.setName("apply").setDescription("Apply for a job")
        .addStringOption((o) => {
          const opt = o.setName("job").setDescription("Job to apply for").setRequired(true);
          JOBS.forEach((j) => opt.addChoices({ name: j.name, value: j.id }));
          return opt;
        })
    )
    .addSubcommand((s) => s.setName("quit").setDescription("Quit your current job"))
    .addSubcommand((s) => s.setName("info").setDescription("View your current job info")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);

    if (isPrisoned(user.prisonEnd)) {
      return interaction.reply({ embeds: [prisonEmbed("In Prison", "You cannot access jobs while in prison.")], ephemeral: true });
    }

    if (sub === "list") {
      const embed = rpEmbed("Available Jobs", "Browse all available careers in the city");
      for (const job of JOBS) {
        embed.addFields({ name: `💼 ${job.name}`, value: `Salary: **$${job.salary.toLocaleString()}**/shift | XP: **+${job.xpGain}**`, inline: true });
      }
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "apply") {
      const jobId = interaction.options.getString("job", true);
      const job = JOBS.find((j) => j.id === jobId);
      if (!job) return interaction.reply({ embeds: [errorEmbed("Invalid Job", "That job does not exist.")], ephemeral: true });

      const char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, isActive: true });
      if (!char) return interaction.reply({ embeds: [errorEmbed("No Character", "You need an active character to apply for a job. Use `/character create`.")], ephemeral: true });
      if (char.isDead) return interaction.reply({ embeds: [errorEmbed("Dead", "Dead characters cannot work.")], ephemeral: true });

      char.job = jobId;
      char.history.push({ event: `Got hired as ${job.name}`, timestamp: new Date() });
      await char.save();

      return interaction.reply({
        embeds: [
          successEmbed("Job Application Approved!", `**${char.name}** is now a **${job.name}**!`)
            .addFields(
              { name: "💼 Position", value: job.name, inline: true },
              { name: "💰 Salary", value: `$${job.salary.toLocaleString()}/shift`, inline: true },
              { name: "⭐ XP Per Shift", value: `+${job.xpGain}`, inline: true },
            )
            .setFooter({ text: "Use /work to start earning!" }),
        ],
      });
    }

    if (sub === "quit") {
      const char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, isActive: true });
      if (!char) return interaction.reply({ embeds: [errorEmbed("No Character", "You have no active character.")], ephemeral: true });
      if (char.job === "Unemployed") return interaction.reply({ embeds: [errorEmbed("Unemployed", "You are already unemployed.")], ephemeral: true });

      const prevJob = char.job;
      char.job = "Unemployed";
      char.history.push({ event: `Quit job: ${prevJob}`, timestamp: new Date() });
      await char.save();
      return interaction.reply({ embeds: [successEmbed("Resigned", `You have resigned from your position as **${prevJob}**.`)] });
    }

    if (sub === "info") {
      const char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, isActive: true });
      if (!char) return interaction.reply({ embeds: [errorEmbed("No Character", "You have no active character.")], ephemeral: true });

      const job = JOBS.find((j) => j.id === char.job);
      return interaction.reply({
        embeds: [
          rpEmbed("Job Information", `Current job for **${char.name}**`)
            .addFields(
              { name: "💼 Job", value: job?.name ?? "Unemployed", inline: true },
              { name: "💰 Salary", value: job ? `$${job.salary.toLocaleString()}/shift` : "N/A", inline: true },
              { name: "⭐ XP/Shift", value: job ? `+${job.xpGain}` : "N/A", inline: true },
            ),
        ],
      });
    }
  },
};
