import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import Character from "../../models/Character.js";
import { errorEmbed } from "../../utils/embeds.js";
import { Colors } from "../../utils/embeds.js";

const SHOP_ITEMS = [
  { id: "phone", name: "📱 Phone", price: 500, category: "Tools" },
  { id: "medkit", name: "🩺 Medkit", price: 1000, category: "Consumables" },
  { id: "lockpick", name: "🔓 Lockpick", price: 800, category: "Tools" },
  { id: "radio", name: "📻 Radio", price: 600, category: "Tools" },
  { id: "laptop", name: "💻 Laptop", price: 2000, category: "Tools" },
  { id: "weapon_pistol", name: "🔫 Pistol", price: 5000, category: "Weapons" },
  { id: "food", name: "🍔 Food", price: 100, category: "Consumables" },
  { id: "water", name: "💧 Water", price: 50, category: "Consumables" },
  { id: "rare_gem", name: "💎 Rare Gem", price: 10000, category: "Rare" },
];

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Manage your character's inventory")
    .addSubcommand((s) => s.setName("view").setDescription("View your inventory"))
    .addSubcommand((s) =>
      s.setName("shop").setDescription("Browse the item shop")
    )
    .addSubcommand((s) =>
      s.setName("buy").setDescription("Buy an item from the shop")
        .addStringOption((o) => {
          const opt = o.setName("item").setDescription("Item to buy").setRequired(true);
          SHOP_ITEMS.forEach((i) => opt.addChoices({ name: i.name, value: i.id }));
          return opt;
        })
    )
    .addSubcommand((s) =>
      s.setName("drop").setDescription("Drop an item from your inventory")
        .addStringOption((o) => o.setName("item").setDescription("Item ID to drop").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, isActive: true });
    if (!char) return interaction.reply({ embeds: [errorEmbed("No Character", "You need an active character.")], ephemeral: true });

    if (sub === "view") {
      if (!char.inventory.length) {
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.rp).setTitle("📦 Inventory").setDescription(`**${char.name}** has no items in their inventory.`).setTimestamp()], ephemeral: true });
      }

      const grouped: Record<string, typeof char.inventory> = {};
      for (const item of char.inventory) {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
      }

      const embed = new EmbedBuilder().setColor(Colors.rp).setTitle(`📦 ${char.name}'s Inventory`).setDescription(`${char.inventory.length} items`);
      for (const [cat, items] of Object.entries(grouped)) {
        embed.addFields({ name: `📂 ${cat}`, value: items.map((i) => `${i.name} x${i.quantity}`).join("\n") });
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "shop") {
      const embed = new EmbedBuilder().setColor(Colors.economy).setTitle("🛒 Item Shop").setDescription("Browse and buy items for your character");
      const cats = [...new Set(SHOP_ITEMS.map((i) => i.category))];
      for (const cat of cats) {
        const items = SHOP_ITEMS.filter((i) => i.category === cat);
        embed.addFields({ name: `📂 ${cat}`, value: items.map((i) => `${i.name} — **$${i.price.toLocaleString()}**`).join("\n") });
      }
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "buy") {
      const itemId = interaction.options.getString("item", true);
      const shopItem = SHOP_ITEMS.find((i) => i.id === itemId);
      if (!shopItem) return interaction.reply({ embeds: [errorEmbed("Not Found", "That item does not exist.")], ephemeral: true });

      const { getOrCreateEconomy, addTransaction, formatMoney } = await import("../../utils/helpers.js");
      const eco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);
      if (eco.wallet < shopItem.price) {
        return interaction.reply({ embeds: [errorEmbed("Insufficient Funds", `You need **${formatMoney(shopItem.price)}** to buy ${shopItem.name}.`)], ephemeral: true });
      }

      eco.wallet -= shopItem.price;
      await eco.save();
      await addTransaction(interaction.user.id, interaction.guildId!, "item_buy", -shopItem.price, `Bought ${shopItem.name}`);

      const existing = char.inventory.find((i) => i.itemId === itemId);
      if (existing) {
        existing.quantity += 1;
      } else {
        char.inventory.push({ itemId, name: shopItem.name, quantity: 1, category: shopItem.category });
      }
      await char.save();

      return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.success).setTitle("✅ Item Purchased").setDescription(`You bought **${shopItem.name}** for **${formatMoney(shopItem.price)}**.`).setTimestamp()] });
    }

    if (sub === "drop") {
      const itemId = interaction.options.getString("item", true);
      const idx = char.inventory.findIndex((i) => i.itemId === itemId);
      if (idx === -1) return interaction.reply({ embeds: [errorEmbed("Not Found", "You don't have that item.")], ephemeral: true });

      const item = char.inventory[idx];
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        char.inventory.splice(idx, 1);
      }
      await char.save();
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.warning).setTitle("🗑️ Item Dropped").setDescription(`Dropped **${item.name}** from your inventory.`).setTimestamp()] });
    }
  },
};
