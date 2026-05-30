import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import Property from "../../models/Property.js";
import Economy from "../../models/Economy.js";
import { getOrCreateUser, isPrisoned, generateId, formatMoney, addTransaction } from "../../utils/helpers.js";
import { propertyEmbed, errorEmbed, successEmbed, prisonEmbed } from "../../utils/embeds.js";

const LISTINGS = [
  { name: "Studio Apartment", type: "apartment", price: 15000, rentPrice: 1000 },
  { name: "City Apartment", type: "apartment", price: 35000, rentPrice: 2000 },
  { name: "Family House", type: "house", price: 75000, rentPrice: 4000 },
  { name: "Luxury Villa", type: "villa", price: 250000, rentPrice: 12000, isVip: true },
  { name: "Warehouse", type: "warehouse", price: 100000, rentPrice: 5000 },
];

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("property")
    .setDescription("Buy, sell and manage properties")
    .addSubcommand((s) => s.setName("listings").setDescription("Browse available properties"))
    .addSubcommand((s) =>
      s.setName("buy").setDescription("Buy a property")
        .addStringOption((o) => o.setName("name").setDescription("Property name from listings").setRequired(true))
    )
    .addSubcommand((s) => s.setName("myproperties").setDescription("View your properties"))
    .addSubcommand((s) =>
      s.setName("sell").setDescription("Sell a property you own")
        .addStringOption((o) => o.setName("name").setDescription("Property name").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);

    if (isPrisoned(user.prisonEnd)) {
      return interaction.reply({ embeds: [prisonEmbed("In Prison", "You cannot buy or manage properties while in prison.")], ephemeral: true });
    }

    if (sub === "listings") {
      const embed = propertyEmbed("Property Listings", "Available properties for purchase in the city");
      for (const p of LISTINGS) {
        embed.addFields({
          name: `${p.isVip ? "💎 " : "🏠 "}${p.name}`,
          value: `Type: **${p.type}** | Price: **${formatMoney(p.price)}** | Rent Value: **${formatMoney(p.rentPrice)}**${p.isVip ? " | VIP Only" : ""}`,
        });
      }
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "buy") {
      const name = interaction.options.getString("name", true);
      const listing = LISTINGS.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (!listing) return interaction.reply({ embeds: [errorEmbed("Not Found", "That property is not in our listings.")], ephemeral: true });

      if (listing.isVip && user.vip.tier === "none") {
        return interaction.reply({ embeds: [errorEmbed("VIP Required", "This property is only available to VIP members.")], ephemeral: true });
      }

      const eco = await Economy.findOne({ userId: interaction.user.id, guildId: interaction.guildId });
      if (!eco || eco.wallet < listing.price) {
        return interaction.reply({ embeds: [errorEmbed("Insufficient Funds", `This property costs **${formatMoney(listing.price)}**. You only have **${formatMoney(eco?.wallet ?? 0)}**.`)], ephemeral: true });
      }

      const propId = generateId("PROP-");
      await Property.create({
        propertyId: propId,
        guildId: interaction.guildId,
        ownerId: interaction.user.id,
        name: `${listing.name} #${propId.slice(-4)}`,
        type: listing.type,
        price: listing.price,
        rentPrice: listing.rentPrice,
        isVip: listing.isVip ?? false,
        isForSale: false,
      });

      eco.wallet -= listing.price;
      eco.totalSpent += listing.price;
      await eco.save();
      await addTransaction(interaction.user.id, interaction.guildId!, "property_buy", -listing.price, `Bought ${listing.name}`);

      return interaction.reply({
        embeds: [
          successEmbed("Property Purchased!", `You are now the proud owner of a **${listing.name}**!`)
            .addFields(
              { name: "🏠 Property", value: listing.name, inline: true },
              { name: "💰 Paid", value: formatMoney(listing.price), inline: true },
              { name: "👛 Remaining", value: formatMoney(eco.wallet), inline: true },
            ),
        ],
      });
    }

    if (sub === "myproperties") {
      const props = await Property.find({ ownerId: interaction.user.id, guildId: interaction.guildId });
      if (!props.length) return interaction.reply({ embeds: [errorEmbed("No Properties", "You don't own any properties. Use `/property listings` to browse.")], ephemeral: true });

      const embed = propertyEmbed("My Properties", `You own **${props.length}** properties`);
      for (const p of props) {
        embed.addFields({ name: `🏠 ${p.name}`, value: `Type: ${p.type} | Rent: ${formatMoney(p.rentPrice)}/period | Tenants: ${p.tenants.length}` });
      }
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "sell") {
      const name = interaction.options.getString("name", true);
      const prop = await Property.findOne({ ownerId: interaction.user.id, guildId: interaction.guildId, name: { $regex: name, $options: "i" } });
      if (!prop) return interaction.reply({ embeds: [errorEmbed("Not Found", "You don't own that property.")], ephemeral: true });

      const salePrice = Math.floor(prop.price * 0.7);
      const eco = await Economy.findOne({ userId: interaction.user.id, guildId: interaction.guildId });
      if (eco) {
        eco.wallet += salePrice;
        eco.totalEarned += salePrice;
        await eco.save();
        await addTransaction(interaction.user.id, interaction.guildId!, "property_sell", salePrice, `Sold ${prop.name}`);
      }
      await prop.deleteOne();

      return interaction.reply({
        embeds: [
          successEmbed("Property Sold!", `You sold **${prop.name}** for **${formatMoney(salePrice)}** (70% of purchase price).`)
        ],
      });
    }
  },
};
