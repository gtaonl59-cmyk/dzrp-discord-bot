import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { Colors } from "../../utils/embeds.js";
import { getOrCreateEconomy, formatMoney, addTransaction } from "../../utils/helpers.js";

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("fun")
    .setDescription("Fun commands and mini-games")
    .addSubcommand((s) => s.setName("coinflip").setDescription("Flip a coin"))
    .addSubcommand((s) =>
      s.setName("dice").setDescription("Roll dice")
        .addIntegerOption((o) => o.setName("sides").setDescription("Number of sides (default 6)").setMinValue(2).setMaxValue(100))
    )
    .addSubcommand((s) =>
      s.setName("casino").setDescription("Play casino (bet money)")
        .addIntegerOption((o) => o.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(100))
    )
    .addSubcommand((s) =>
      s.setName("wheel").setDescription("Spin the lucky wheel")
        .addIntegerOption((o) => o.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(50))
    )
    .addSubcommand((s) => s.setName("trivia").setDescription("Answer a random trivia question"))
    .addSubcommand((s) =>
      s.setName("rps").setDescription("Rock Paper Scissors")
        .addStringOption((o) =>
          o.setName("choice").setDescription("Your choice").setRequired(true)
            .addChoices({ name: "Rock ✊", value: "rock" }, { name: "Paper ✋", value: "paper" }, { name: "Scissors ✌️", value: "scissors" })
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "coinflip") {
      const result = Math.random() < 0.5 ? "Heads 👑" : "Tails 🌀";
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.gold).setTitle("🪙 Coin Flip").setDescription(`The coin landed on **${result}**!`).setTimestamp()],
      });
    }

    if (sub === "dice") {
      const sides = interaction.options.getInteger("sides") ?? 6;
      const roll = Math.floor(Math.random() * sides) + 1;
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.info).setTitle("🎲 Dice Roll").setDescription(`You rolled a **${roll}** on a **d${sides}**!`).setTimestamp()],
      });
    }

    if (sub === "casino") {
      const bet = interaction.options.getInteger("bet", true);
      const eco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);
      if (eco.wallet < bet) return interaction.reply({ content: `❌ You only have **${formatMoney(eco.wallet)}**.`, ephemeral: true });

      const roll = Math.random();
      let result = "";
      let change = 0;

      if (roll < 0.05) { result = "🎰 JACKPOT! 10x!"; change = bet * 10; }
      else if (roll < 0.25) { result = "🎉 Big Win! 3x!"; change = bet * 3; }
      else if (roll < 0.45) { result = "✅ Win! 2x!"; change = bet * 2; }
      else if (roll < 0.55) { result = "🔄 Push! Money back."; change = 0; }
      else { result = "❌ You lost!"; change = -bet; }

      eco.wallet += change;
      if (change > 0) eco.totalEarned += change;
      if (change < 0) eco.totalSpent += Math.abs(change);
      await eco.save();
      if (change !== 0) await addTransaction(interaction.user.id, interaction.guildId!, "casino", change, "Casino");

      const color = change > 0 ? Colors.success : change < 0 ? Colors.error : Colors.warning;
      return interaction.reply({
        embeds: [
          new EmbedBuilder().setColor(color).setTitle("🎰 Casino")
            .addFields(
              { name: "🎲 Result", value: result, inline: true },
              { name: "💰 Bet", value: formatMoney(bet), inline: true },
              { name: "💵 Change", value: `${change >= 0 ? "+" : ""}${formatMoney(change)}`, inline: true },
              { name: "👛 Balance", value: formatMoney(eco.wallet), inline: true },
            ).setTimestamp(),
        ],
      });
    }

    if (sub === "wheel") {
      const bet = interaction.options.getInteger("bet", true);
      const eco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);
      if (eco.wallet < bet) return interaction.reply({ content: `❌ You only have **${formatMoney(eco.wallet)}**.`, ephemeral: true });

      const segments = [
        { emoji: "💀", label: "Bankrupt!", multiplier: 0 },
        { emoji: "🔴", label: "0.5x", multiplier: 0.5 },
        { emoji: "🟡", label: "1x Push", multiplier: 1 },
        { emoji: "🟢", label: "1.5x", multiplier: 1.5 },
        { emoji: "🔵", label: "2x Win!", multiplier: 2 },
        { emoji: "🌈", label: "3x Big Win!", multiplier: 3 },
        { emoji: "⭐", label: "5x Mega!", multiplier: 5 },
      ];
      const seg = segments[Math.floor(Math.random() * segments.length)];
      const payout = Math.floor(bet * seg.multiplier);
      const change = payout - bet;

      eco.wallet += change;
      if (change > 0) eco.totalEarned += change;
      if (change < 0) eco.totalSpent += Math.abs(change);
      await eco.save();
      if (change !== 0) await addTransaction(interaction.user.id, interaction.guildId!, "wheel", change, "Lucky Wheel");

      const color = change > 0 ? Colors.success : change < 0 ? Colors.error : Colors.warning;
      return interaction.reply({
        embeds: [
          new EmbedBuilder().setColor(color).setTitle(`${seg.emoji} Lucky Wheel — ${seg.label}`)
            .addFields(
              { name: "💰 Bet", value: formatMoney(bet), inline: true },
              { name: "💵 Payout", value: formatMoney(payout), inline: true },
              { name: "👛 Balance", value: formatMoney(eco.wallet), inline: true },
            ).setTimestamp(),
        ],
      });
    }

    if (sub === "trivia") {
      const questions = [
        { q: "What is the capital of France?", a: "paris", options: ["Berlin", "Paris", "London", "Rome"] },
        { q: "What is 7 × 8?", a: "56", options: ["48", "54", "56", "64"] },
        { q: "What color is the sky on a clear day?", a: "blue", options: ["Blue", "Green", "Red", "Yellow"] },
        { q: "How many sides does a hexagon have?", a: "6", options: ["5", "6", "7", "8"] },
        { q: "What planet is closest to the Sun?", a: "mercury", options: ["Venus", "Earth", "Mercury", "Mars"] },
      ];
      const q = questions[Math.floor(Math.random() * questions.length)];
      const correct = q.options.find((o) => o.toLowerCase() === q.a)!;

      await interaction.reply({
        embeds: [
          new EmbedBuilder().setColor(Colors.info).setTitle("🧠 Trivia Question").setDescription(`**${q.q}**\n\n${q.options.map((o, i) => `**${i + 1}.** ${o}`).join("\n")}`).setFooter({ text: "Reply with the number of your answer!" }).setTimestamp(),
        ],
      });

      const collector = interaction.channel!.createMessageCollector({ filter: (m) => m.author.id === interaction.user.id, time: 15000, max: 1 });
      collector.on("collect", async (msg) => {
        const idx = parseInt(msg.content) - 1;
        const chosen = q.options[idx];
        if (chosen?.toLowerCase() === q.a) {
          await msg.reply({ embeds: [new EmbedBuilder().setColor(Colors.success).setTitle("✅ Correct!").setDescription(`The answer was **${correct}**! +50 XP`)] });
        } else {
          await msg.reply({ embeds: [new EmbedBuilder().setColor(Colors.error).setTitle("❌ Wrong!").setDescription(`The correct answer was **${correct}**.`)] });
        }
      });
      collector.on("end", (collected) => {
        if (collected.size === 0) interaction.followUp({ content: `⏰ Time's up! The answer was **${correct}**.`, ephemeral: true });
      });
      return;
    }

    if (sub === "rps") {
      const choices = ["rock", "paper", "scissors"];
      const emojis: Record<string, string> = { rock: "✊", paper: "✋", scissors: "✌️" };
      const player = interaction.options.getString("choice", true);
      const bot = choices[Math.floor(Math.random() * choices.length)];

      let result = "";
      if (player === bot) result = "🔄 It's a tie!";
      else if (
        (player === "rock" && bot === "scissors") ||
        (player === "paper" && bot === "rock") ||
        (player === "scissors" && bot === "paper")
      ) result = "🎉 You win!";
      else result = "❌ Bot wins!";

      const color = result.includes("win!") ? Colors.success : result.includes("tie") ? Colors.warning : Colors.error;
      return interaction.reply({
        embeds: [
          new EmbedBuilder().setColor(color).setTitle("✌️ Rock Paper Scissors")
            .addFields(
              { name: "👤 You", value: `${emojis[player]} ${player}`, inline: true },
              { name: "🤖 Bot", value: `${emojis[bot]} ${bot}`, inline: true },
              { name: "🏆 Result", value: result, inline: false },
            ).setTimestamp(),
        ],
      });
    }
  },
};
