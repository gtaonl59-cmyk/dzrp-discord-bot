import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getOrCreateEconomy, getOrCreateUser, formatMoney, cooldownRemaining, formatDuration, isPrisoned, addTransaction } from "../../utils/helpers.js";
import { errorEmbed, successEmbed, prisonEmbed } from "../../utils/embeds.js";

const ROB_COOLDOWN = 30 * 60 * 1000;

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Attempt to rob another user's wallet (risky!)")
    .addUserOption((o) => o.setName("user").setDescription("User to rob").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed("Invalid", "You can't rob yourself.")], ephemeral: true });
    if (target.bot) return interaction.reply({ embeds: [errorEmbed("Invalid", "You can't rob a bot.")], ephemeral: true });

    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);
    if (isPrisoned(user.prisonEnd)) {
      return interaction.reply({ embeds: [prisonEmbed("In Prison", "You can't rob anyone while in prison.")], ephemeral: true });
    }

    const robberEco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);
    const lastRob = robberEco.transactions.filter(t => t.type === "rob_attempt").pop()?.timestamp ?? null;
    const remaining = cooldownRemaining(lastRob, ROB_COOLDOWN);
    if (remaining > 0) {
      return interaction.reply({ embeds: [errorEmbed("Cooldown", `You need to lay low for **${formatDuration(remaining)}** before robbing again.`)], ephemeral: true });
    }

    const targetEco = await getOrCreateEconomy(target.id, interaction.guildId!);
    if (targetEco.wallet < 500) {
      return interaction.reply({ embeds: [errorEmbed("Too Poor", `<@${target.id}> doesn't have enough money to rob (minimum $500).`)], ephemeral: true });
    }

    await addTransaction(interaction.user.id, interaction.guildId!, "rob_attempt", 0, `Rob attempt on ${target.tag}`);

    const success = Math.random() < 0.45;
    if (success) {
      const maxSteal = Math.min(targetEco.wallet * 0.3, 5000);
      const stolen = Math.floor(Math.random() * maxSteal + 100);
      robberEco.wallet += stolen;
      robberEco.totalEarned += stolen;
      targetEco.wallet -= stolen;
      targetEco.totalSpent += stolen;
      await robberEco.save();
      await targetEco.save();
      await addTransaction(interaction.user.id, interaction.guildId!, "rob_success", stolen, `Robbed ${target.tag}`);
      await addTransaction(target.id, interaction.guildId!, "robbed", -stolen, `Robbed by ${interaction.user.tag}`);

      return interaction.reply({
        embeds: [
          successEmbed("Successful Robbery!", `You sneaked up on <@${target.id}> and snatched **${formatMoney(stolen)}**! 🥷`)
            .addFields(
              { name: "💰 Stolen", value: formatMoney(stolen), inline: true },
              { name: "👛 Your Balance", value: formatMoney(robberEco.wallet), inline: true },
            ),
        ],
      });
    } else {
      const fine = Math.floor(Math.random() * 1000 + 500);
      robberEco.wallet = Math.max(0, robberEco.wallet - fine);
      robberEco.totalSpent += fine;
      await robberEco.save();
      await addTransaction(interaction.user.id, interaction.guildId!, "rob_fail", -fine, `Failed robbery fine`);

      return interaction.reply({
        embeds: [
          errorEmbed("Caught!", `You were caught trying to rob <@${target.id}>! You paid a fine of **${formatMoney(fine)}**. 🚔`)
            .addFields({ name: "💸 Fine Paid", value: formatMoney(fine), inline: true }),
        ],
      });
    }
  },
};
