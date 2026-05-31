import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

const COOLDOWN = 60 * 60 * 1000;
const ECO_DEF = { wallet: 500, bank: 0, xp: 0, level: 1 };

const WORK_MESSAGES = [
  'You delivered packages and earned', 'You fixed cars at the garage and earned',
  'You drove a taxi shift and earned', 'You worked security at the club and earned',
  'You cooked at a restaurant and earned', 'You helped at the docks and earned',
  'You wrote code for a startup and earned', 'You sold hotdogs on the street and earned',
];

export default {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn money (1h cooldown)'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const eco = getUser('economy', userId, ECO_DEF);
    const jobs = getUser('jobs', userId, { job: null });
    const prison = getUser('prison', userId, { jailed: false });

    if (prison.jailed && prison.release > Date.now()) {
      return interaction.reply({ content: '🔒 You are in prison and cannot work!', ephemeral: true });
    }

    const now = Date.now();
    if (now - (eco.lastWork ?? 0) < COOLDOWN) {
      const remaining = COOLDOWN - (now - eco.lastWork);
      const m = Math.floor(remaining / 60000);
      return interaction.reply({ content: `⏳ You're tired! Work again in **${m}m**.`, ephemeral: true });
    }

    const base = jobs.job ? 200 : 100;
    const pay = Math.floor(base + Math.random() * base);
    const msg = WORK_MESSAGES[Math.floor(Math.random() * WORK_MESSAGES.length)];

    eco.wallet = (eco.wallet ?? 0) + pay;
    eco.xp = (eco.xp ?? 0) + 30;
    eco.level = Math.floor(eco.xp / 500) + 1;
    eco.lastWork = now;
    saveUser('economy', userId, eco);

    const embed = new EmbedBuilder()
      .setTitle('💼 Work Complete!')
      .setColor(0x3498db)
      .setDescription(`${msg} **$${pay.toLocaleString()}**`)
      .addFields(
        { name: '👛 Wallet', value: `$${eco.wallet.toLocaleString()}`, inline: true },
        { name: '⭐ XP', value: '+30 XP', inline: true },
        { name: '💼 Job Bonus', value: jobs.job ? `Yes (${jobs.job})` : 'None', inline: true },
      );
    await interaction.reply({ embeds: [embed] });
  },
};
