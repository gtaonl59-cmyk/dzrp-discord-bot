import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../storage.js';

const TIERS = {
  bronze:   { price: 5000,   color: 0xcd7f32, mult: 1.25, bankLimit: 50000  },
  silver:   { price: 15000,  color: 0xc0c0c0, mult: 1.5,  bankLimit: 100000 },
  gold:     { price: 35000,  color: 0xf1c40f, mult: 2.0,  bankLimit: 250000 },
  platinum: { price: 75000,  color: 0xe0e0e0, mult: 2.5,  bankLimit: 500000 },
  diamond:  { price: 150000, color: 0x00cfff, mult: 3.0,  bankLimit: 1000000 },
};

export default {
  data: new SlashCommandBuilder()
    .setName('vip')
    .setDescription('VIP membership')
    .addSubcommand(s => s.setName('info').setDescription('View VIP tiers and perks'))
    .addSubcommand(s => s.setName('status').setDescription('Check your VIP status'))
    .addSubcommand(s => s.setName('buy').setDescription('Purchase a VIP tier')
      .addStringOption(o => {
        o.setName('tier').setDescription('Tier to buy').setRequired(true);
        Object.keys(TIERS).forEach(t => o.addChoices({ name: t.charAt(0).toUpperCase() + t.slice(1), value: t }));
        return o;
      }))
    .addSubcommand(s => s.setName('grant').setDescription('Grant VIP to a user (admin only)')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => {
        o.setName('tier').setDescription('Tier').setRequired(true);
        Object.keys(TIERS).forEach(t => o.addChoices({ name: t.charAt(0).toUpperCase() + t.slice(1), value: t }));
        return o;
      })),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'info') {
      const desc = Object.entries(TIERS).map(([name, t]) =>
        `**${name.charAt(0).toUpperCase() + name.slice(1)}** — $${t.price.toLocaleString()}\n• ${t.mult}x daily/weekly • Bank limit $${t.bankLimit.toLocaleString()}`
      ).join('\n\n');
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('💎 VIP Tiers').setColor(0xf1c40f).setDescription(desc)],
        ephemeral: true,
      });
    }

    if (sub === 'status') {
      const vip = getUser('vip', userId, { tier: 'none' });
      if (vip.tier === 'none') return interaction.reply({ content: '❌ You have no VIP membership. Use `/vip buy` to get one.', ephemeral: true });
      const t = TIERS[vip.tier];
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('💎 Your VIP Status').setColor(t?.color ?? 0xf1c40f)
          .addFields(
            { name: 'Tier', value: vip.tier.charAt(0).toUpperCase() + vip.tier.slice(1), inline: true },
            { name: 'Reward Multiplier', value: `${t?.mult ?? 1}x`, inline: true },
            { name: 'Bank Limit', value: `$${(t?.bankLimit ?? 0).toLocaleString()}`, inline: true },
          )],
      });
    }

    if (sub === 'buy') {
      const tier = interaction.options.getString('tier');
      const t = TIERS[tier];
      const eco = getUser('economy', userId, { wallet: 0, bank: 0 });
      const total = (eco.wallet ?? 0) + (eco.bank ?? 0);
      if (total < t.price) return interaction.reply({ content: `❌ You need $${t.price.toLocaleString()}. You have $${total.toLocaleString()}.`, ephemeral: true });

      let remaining = t.price;
      if (eco.wallet >= remaining) { eco.wallet -= remaining; }
      else { remaining -= eco.wallet; eco.wallet = 0; eco.bank = Math.max(0, (eco.bank ?? 0) - remaining); }
      saveUser('economy', userId, eco);
      saveUser('vip', userId, { tier });
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('💎 VIP Activated!').setColor(t.color)
          .setDescription(`You are now a **${tier.charAt(0).toUpperCase() + tier.slice(1)} VIP** member!\n\n• **${t.mult}x** daily/weekly multiplier\n• Bank limit: $${t.bankLimit.toLocaleString()}`)],
      });
    }

    if (sub === 'grant') {
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
      }
      const target = interaction.options.getUser('user');
      const tier = interaction.options.getString('tier');
      saveUser('vip', target.id, { tier });
      return interaction.reply({ content: `✅ Granted **${tier}** VIP to **${target.username}**.` });
    }
  },
};
