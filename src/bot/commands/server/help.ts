import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { Colors } from "../../utils/embeds.js";

const CATEGORIES = [
  {
    name: "🎭 Roleplay",
    commands: ["/character", "/me", "/say", "/do", "/inventory"],
    desc: "Create characters, perform RP actions, manage inventory",
  },
  {
    name: "💰 Economy",
    commands: ["/balance", "/daily", "/weekly", "/bank", "/transfer", "/work", "/rob", "/transactions"],
    desc: "Wallet, bank, earning and spending money",
  },
  {
    name: "💼 Jobs",
    commands: ["/job list", "/job apply", "/job quit", "/job info"],
    desc: "Apply for jobs and earn a salary",
  },
  {
    name: "🏠 Property",
    commands: ["/property listings", "/property buy", "/property myproperties", "/property sell"],
    desc: "Buy, sell and manage properties",
  },
  {
    name: "🚗 Vehicles",
    commands: ["/vehicle dealership", "/vehicle buy", "/vehicle garage", "/vehicle sell", "/vehicle register", "/vehicle insure"],
    desc: "Vehicle dealership, ownership and management",
  },
  {
    name: "💀 Gang/Mafia",
    commands: ["/gang create", "/gang info", "/gang invite", "/gang kick", "/gang leave", "/gang list"],
    desc: "Create and manage gangs or mafias",
  },
  {
    name: "🔒 Prison",
    commands: ["/prison jail", "/prison release", "/prison status", "/prison check"],
    desc: "Prison system",
  },
  {
    name: "🎫 Tickets",
    commands: ["/ticket create", "/ticket close", "/ticket list", "/ticket add"],
    desc: "Support ticket system",
  },
  {
    name: "👤 Profile",
    commands: ["/profile", "/rank me", "/rank top"],
    desc: "View profiles and leaderboards",
  },
  {
    name: "💎 VIP",
    commands: ["/vip info", "/vip buy", "/vip status"],
    desc: "VIP tiers and exclusive benefits",
  },
  {
    name: "🎮 Fun",
    commands: ["/fun coinflip", "/fun dice", "/fun casino", "/fun wheel", "/fun trivia", "/fun rps"],
    desc: "Games and entertainment",
  },
  {
    name: "🛡️ Moderation",
    commands: ["/mod ban", "/mod kick", "/mod warn", "/mod timeout", "/mod unban", "/mod warnings", "/mod purge"],
    desc: "Moderation tools (staff only)",
  },
  {
    name: "⚙️ Server",
    commands: ["/setup", "/suggest", "/giveaway"],
    desc: "Server configuration (admin only)",
  },
];

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("View all available bot commands")
    .addStringOption((o) => {
      const opt = o.setName("category").setDescription("Filter by category").setRequired(false);
      CATEGORIES.forEach((c) => opt.addChoices({ name: c.name, value: c.name }));
      return opt;
    }),

  async execute(interaction: ChatInputCommandInteraction) {
    const categoryFilter = interaction.options.getString("category");

    if (categoryFilter) {
      const cat = CATEGORIES.find((c) => c.name === categoryFilter);
      if (!cat) return interaction.reply({ content: "Category not found.", ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(Colors.primary)
        .setTitle(`${cat.name} Commands`)
        .setDescription(cat.desc)
        .addFields({ name: "📋 Commands", value: cat.commands.map((c) => `\`${c}\``).join("\n") })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.primary)
      .setTitle("🎭 RP City Bot — Command Reference")
      .setDescription("A complete Discord Roleplay Bot with economy, properties, vehicles, gangs, prison, VIP, and more!\n\nUse `/help category` for detailed commands.")
      .setThumbnail(interaction.client.user!.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: "Use /help <category> for detailed info on each category" });

    for (const cat of CATEGORIES) {
      embed.addFields({
        name: cat.name,
        value: `${cat.desc}\n${cat.commands.slice(0, 3).map((c) => `\`${c}\``).join(" ")}${cat.commands.length > 3 ? ` +${cat.commands.length - 3} more` : ""}`,
        inline: true,
      });
    }

    return interaction.reply({ embeds: [embed] });
  },
};
