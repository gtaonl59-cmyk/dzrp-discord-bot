import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { getOrCreateUser, getOrCreateEconomy, VIP_TIERS, getVipBankLimit } from "../../utils/helpers.js";
import { Colors, successEmbed, errorEmbed } from "../../utils/embeds.js";
import Economy from "../../models/Economy.js";

const VIP_PRICES: Record<string, number> = {
  bronze: 50000,
  silver: 150000,
  gold: 350000,
  platinum: 800000,
  diamond: 2000000,
};

const VIP_DURATION_DAYS = 30;

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("vip")
    .setDescription("VIP system — purchase and manage VIP status")
    .addSubcommand((s) => s.setName("info").setDescription("View VIP tiers and benefits"))
    .addSubcommand((s) =>
      s.setName("buy").setDescription("Purchase a VIP tier")
        .addStringOption((o) => {
          const opt = o.setName("tier").setDescription("VIP tier to buy").setRequired(true);
          VIP_TIERS.forEach((t) => opt.addChoices({ name: `${t.emoji} ${t.name}`, value: t.id }));
          return opt;
        })
    )
    .addSubcommand((s) => s.setName("status").setDescription("Check your VIP status"))
    .addSubcommand((s) =>
      s.setName("grant").setDescription("Grant VIP to a user [Admin only]")
        .addUserOption((o) => o.setName("user").setDescription("User to grant VIP").setRequired(true))
        .addStringOption((o) => {
          const opt = o.setName("tier").setDescription("VIP tier").setRequired(true);
          VIP_TIERS.forEach((t) => opt.addChoices({ name: `${t.emoji} ${t.name}`, value: t.id }));
          return opt;
        })
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "info") {
      const embed = new EmbedBuilder()
        .setColor(Colors.gold)
        .setTitle("💎 VIP Tiers & Benefits")
        .setDescription("Upgrade your experience with VIP status!");

      for (const tier of VIP_TIERS) {
        const price = VIP_PRICES[tier.id];
        embed.addFields({
          name: `${tier.emoji} ${tier.name} VIP`,
          value: [
            `**Price:** $${price.toLocaleString()} / 30 days`,
            `**Bank Limit:** $${getVipBankLimit(tier.id).toLocaleString()}`,
            `**XP Multiplier:** ${tier.id === "bronze" ? "1.1x" : tier.id === "silver" ? "1.25x" : tier.id === "gold" ? "1.5x" : tier.id === "platinum" ? "2x" : "3x"}`,
            `**Daily Bonus:** ${tier.id === "bronze" ? "1.1x" : tier.id === "silver" ? "1.25x" : tier.id === "gold" ? "1.5x" : tier.id === "platinum" ? "2x" : "3x"}`,
            `**VIP Exclusive Commands, Jobs, Properties, Vehicles**`,
          ].join("\n"),
        });
      }
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "buy") {
      const tierId = interaction.options.getString("tier", true);
      const tier = VIP_TIERS.find((t) => t.id === tierId);
      if (!tier) return interaction.reply({ embeds: [errorEmbed("Invalid Tier", "That VIP tier does not exist.")], ephemeral: true });

      const price = VIP_PRICES[tierId];
      const eco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);
      if (eco.wallet < price) {
        return interaction.reply({ embeds: [errorEmbed("Insufficient Funds", `${tier.emoji} **${tier.name} VIP** costs **$${price.toLocaleString()}**. You have **$${eco.wallet.toLocaleString()}**.`)], ephemeral: true });
      }

      eco.wallet -= price;
      eco.totalSpent += price;
      eco.bankLimit = getVipBankLimit(tierId);
      await eco.save();

      const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);
      user.vip.tier = tierId;
      user.vip.expiresAt = new Date(Date.now() + VIP_DURATION_DAYS * 24 * 60 * 60 * 1000);
      if (!user.badges.includes(`vip_${tierId}`)) user.badges.push(`vip_${tierId}`);
      await user.save();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(tier.color)
            .setTitle(`${tier.emoji} ${tier.name} VIP Activated!`)
            .setDescription(`Welcome to the **${tier.name}** VIP tier! Enjoy your exclusive benefits.`)
            .addFields(
              { name: "💰 Paid", value: `$${price.toLocaleString()}`, inline: true },
              { name: "📅 Expires", value: `<t:${Math.floor(user.vip.expiresAt!.getTime() / 1000)}:R>`, inline: true },
              { name: "🏦 New Bank Limit", value: `$${getVipBankLimit(tierId).toLocaleString()}`, inline: true },
            )
            .setTimestamp(),
        ],
      });
    }

    if (sub === "status") {
      const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);
      const tier = VIP_TIERS.find((t) => t.id === user.vip.tier);

      if (!tier || user.vip.tier === "none") {
        return interaction.reply({ embeds: [errorEmbed("No VIP", "You do not have a VIP subscription. Use `/vip buy` to purchase one.")], ephemeral: true });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(tier.color)
            .setTitle(`${tier.emoji} Your VIP Status`)
            .addFields(
              { name: "🏷️ Tier", value: `${tier.emoji} ${tier.name}`, inline: true },
              { name: "📅 Expires", value: user.vip.expiresAt ? `<t:${Math.floor(user.vip.expiresAt.getTime() / 1000)}:R>` : "Never", inline: true },
            )
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }

    if (sub === "grant") {
      const member = interaction.guild!.members.cache.get(interaction.user.id)!;
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ embeds: [errorEmbed("No Permission", "Only administrators can grant VIP.")], ephemeral: true });
      }

      const target = interaction.options.getUser("user", true);
      const tierId = interaction.options.getString("tier", true);
      const tier = VIP_TIERS.find((t) => t.id === tierId)!;

      const user = await getOrCreateUser(target.id, interaction.guildId!);
      user.vip.tier = tierId;
      user.vip.expiresAt = new Date(Date.now() + VIP_DURATION_DAYS * 24 * 60 * 60 * 1000);
      await user.save();

      const eco = await Economy.findOne({ userId: target.id, guildId: interaction.guildId });
      if (eco) { eco.bankLimit = getVipBankLimit(tierId); await eco.save(); }

      return interaction.reply({ embeds: [successEmbed("VIP Granted", `${tier.emoji} **${tier.name} VIP** has been granted to <@${target.id}> for 30 days.`)] });
    }
  },
};
