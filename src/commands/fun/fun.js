import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

const TRIVIA = [
  { q: 'What is the capital of France?', a: 'paris', hint: 'City of Lights' },
  { q: 'How many sides does a hexagon have?', a: '6', hint: 'Think of a beehive' },
  { q: 'What planet is closest to the Sun?', a: 'mercury', hint: 'Smallest planet' },
  { q: 'Who wrote Romeo and Juliet?', a: 'shakespeare', hint: 'Famous English playwright' },
  { q: 'What is 12 × 12?', a: '144', hint: 'A dozen dozens' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('fun')
    .setDescription('Play fun mini-games')
    .addSubcommand(s => s.setName('coinflip').setDescription('Flip a coin and bet')
      .addStringOption(o => o.setName('choice').setDescription('heads or tails').setRequired(true).addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' }))
      .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10)))
    .addSubcommand(s => s.setName('dice').setDescription('Roll a dice (1–6)'))
    .addSubcommand(s => s.setName('casino').setDescription('Spin the slot machine')
      .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(50)))
    .addSubcommand(s => s.setName('rps').setDescription('Rock Paper Scissors')
      .addStringOption(o => o.setName('choice').setDescription('Your move').setRequired(true).addChoices({ name: 'Rock', value: 'rock' }, { name: 'Paper', value: 'paper' }, { name: 'Scissors', value: 'scissors' })))
    .addSubcommand(s => s.setName('trivia').setDescription('Answer a trivia question for cash')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const eco = getUser('economy', userId, { wallet: 500, bank: 0 });

    if (sub === 'coinflip') {
      const choice = interaction.options.getString('choice');
      const bet = interaction.options.getInteger('bet');
      if ((eco.wallet ?? 0) < bet) return interaction.reply({ content: `❌ Not enough in wallet ($${eco.wallet}).`, ephemeral: true });
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const win = result === choice;
      eco.wallet = (eco.wallet ?? 0) + (win ? bet : -bet);
      saveUser('economy', userId, eco);
      const embed = new EmbedBuilder()
        .setTitle(`🪙 Coin Flip — ${result.toUpperCase()}!`)
        .setColor(win ? 0x2ecc71 : 0xe74c3c)
        .setDescription(win ? `✅ You won **$${bet.toLocaleString()}**!` : `❌ You lost **$${bet.toLocaleString()}**.`)
        .addFields({ name: '👛 Wallet', value: `$${eco.wallet.toLocaleString()}`, inline: true });
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'dice') {
      const roll = Math.floor(Math.random() * 6) + 1;
      const dice = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'][roll - 1];
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🎲 Dice Roll').setColor(0x3498db)
          .setDescription(`You rolled ${dice} — **${roll}**!`)],
      });
    }

    if (sub === 'casino') {
      const bet = interaction.options.getInteger('bet');
      if ((eco.wallet ?? 0) < bet) return interaction.reply({ content: `❌ Not enough in wallet ($${eco.wallet}).`, ephemeral: true });
      const symbols = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
      const reels = [0, 1, 2].map(() => symbols[Math.floor(Math.random() * symbols.length)]);
      let mult = 0;
      if (reels[0] === reels[1] && reels[1] === reels[2]) {
        mult = reels[0] === '💎' ? 10 : reels[0] === '7️⃣' ? 7 : 3;
      } else if (reels[0] === reels[1] || reels[1] === reels[2]) {
        mult = 1.5;
      }
      const change = mult > 0 ? Math.floor(bet * mult) - bet : -bet;
      eco.wallet = (eco.wallet ?? 0) + change;
      saveUser('economy', userId, eco);
      const win = change >= 0;
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🎰 Slot Machine')
          .setColor(win ? 0xf1c40f : 0xe74c3c)
          .setDescription(`${reels.join(' | ')}\n\n${win ? `✅ You won **$${change.toLocaleString()}**! (${mult}x)` : `❌ You lost **$${bet.toLocaleString()}**.`}`)
          .addFields({ name: '👛 Wallet', value: `$${eco.wallet.toLocaleString()}`, inline: true })],
      });
    }

    if (sub === 'rps') {
      const choices = ['rock', 'paper', 'scissors'];
      const player = interaction.options.getString('choice');
      const bot = choices[Math.floor(Math.random() * 3)];
      const wins = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
      const icons = { rock: '🪨', paper: '📄', scissors: '✂️' };
      let result = '🤝 Draw!'; let color = 0x95a5a6;
      if (wins[player] === bot) { result = '✅ You Win!'; color = 0x2ecc71; }
      else if (wins[bot] === player) { result = '❌ You Lose!'; color = 0xe74c3c; }
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('✊ Rock Paper Scissors').setColor(color)
          .setDescription(`You: ${icons[player]} **${player}**\nBot: ${icons[bot]} **${bot}**\n\n**${result}**`)],
      });
    }

    if (sub === 'trivia') {
      const q = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
      const reward = 300;
      await interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🧠 Trivia!').setColor(0x9b59b6)
          .setDescription(`**${q.q}**\n\n💡 Hint: *${q.hint}*\n\nType your answer in chat within 15 seconds!`)],
      });
      const filter = m => m.author.id === userId;
      const collected = await interaction.channel?.awaitMessages({ filter, max: 1, time: 15000 }).catch(() => null);
      if (!collected?.size) return interaction.followUp({ content: `⏰ Time's up! The answer was **${q.a}**.` });
      const answer = collected.first().content.trim().toLowerCase();
      if (answer === q.a) {
        eco.wallet = (eco.wallet ?? 0) + reward;
        saveUser('economy', userId, eco);
        return interaction.followUp({ content: `✅ Correct! You earned **$${reward}**! 🎉` });
      }
      return interaction.followUp({ content: `❌ Wrong! The answer was **${q.a}**.` });
    }
  },
};
