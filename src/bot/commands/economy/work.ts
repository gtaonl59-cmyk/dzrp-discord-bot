import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import {
  getOrCreateEconomy, getOrCreateUser, formatMoney,
  cooldownRemaining, formatDuration, addTransaction, isPrisoned,
} from "../../utils/helpers.js";
import { economyEmbed, errorEmbed, prisonEmbed } from "../../utils/embeds.js";
import Character from "../../models/Character.js";

const WORK_COOLDOWN = 60 * 60 * 1000;

const workMessages: Record<string, string[]> = {
  police: ["You patrolled the streets and caught a criminal.", "You issued traffic tickets.", "You responded to a disturbance call."],
  ems: ["You treated accident victims.", "You performed emergency surgery.", "You saved a life tonight."],
  mechanic: ["You fixed 3 cars today.", "You changed tires and oil.", "You repaired an engine."],
  taxi: ["You drove 20 passengers around the city.", "You completed a long-distance fare.", "You drove all night."],
  truck: ["You delivered a full load across the state.", "You drove 500 miles.", "You unloaded cargo at the warehouse."],
  fisherman: ["You caught a haul of fish.", "You spent the day on the water.", "You hauled in a big catch."],
  miner: ["You dug through the coal mine.", "You found some precious ore.", "You worked the night shift."],
  farmer: ["You harvested the fields.", "You tended to the crops.", "You sold your produce at market."],
  delivery: ["You delivered 30 packages.", "You completed express deliveries.", "You navigated traffic all day."],
  security: ["You guarded the building overnight.", "You stopped a shoplifter.", "You monitored the cameras."],
  judge: ["You presided over 5 court cases.", "You issued verdicts.", "You reviewed legal briefs."],
  lawyer: ["You defended a client successfully.", "You filed legal motions.", "You won your case."],
  business: ["Your business earned a great profit.", "You managed your employees.", "You closed a big deal."],
  default: ["You did some odd jobs around town.", "You helped a neighbor move.", "You freelanced today."],
};

export default {
  cooldown: 5,
  data: new SlashCommandBuilder().setName("work").setDescription("Work your job to earn money"),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);

    if (isPrisoned(user.prisonEnd)) {
      return interaction.reply({
        embeds: [prisonEmbed("In Prison", `You cannot work while in prison!\nRelease: <t:${Math.floor(user.prisonEnd!.getTime() / 1000)}:R>`)],
        ephemeral: true,
      });
    }

    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);
    const remaining = cooldownRemaining(
      eco.transactions.filter((t) => t.type === "work").pop()?.timestamp ?? null,
      WORK_COOLDOWN
    );
    if (remaining > 0) {
      return interaction.reply({
        embeds: [errorEmbed("Work Cooldown", `You are tired. Rest for **${formatDuration(remaining)}** before working again.`)],
        ephemeral: true,
      });
    }

    const char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, isActive: true });
    const jobId = char?.job ?? "default";

    const msgs = workMessages[jobId] ?? workMessages["default"];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];

    const { JOBS } = await import("../../utils/helpers.js");
    const job = JOBS.find((j) => j.id === jobId);
    const baseSalary = job?.salary ?? 500;
    const bonus = Math.floor(Math.random() * baseSalary * 0.2);
    const total = baseSalary + bonus;

    eco.wallet += total;
    eco.totalEarned += total;
    await eco.save();

    user.xp += job?.xpGain ?? 20;
    user.totalMessages += 1;
    await user.save();

    await addTransaction(interaction.user.id, interaction.guildId!, "work", total, `Work: ${jobId}`);

    await interaction.reply({
      embeds: [
        economyEmbed("Work Complete!", msg)
          .addFields(
            { name: "💼 Job", value: job?.name ?? "Freelancer", inline: true },
            { name: "💰 Earned", value: formatMoney(total), inline: true },
            { name: "🎁 Bonus", value: formatMoney(bonus), inline: true },
            { name: "👛 Balance", value: formatMoney(eco.wallet), inline: true },
            { name: "⭐ XP Gained", value: `+${job?.xpGain ?? 20}`, inline: true },
          )
          .setFooter({ text: "You can work again in 1 hour" }),
      ],
    });
  },
};
