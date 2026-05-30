import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import Vehicle from "../../models/Vehicle.js";
import Economy from "../../models/Economy.js";
import { getOrCreateUser, isPrisoned, generateId, generatePlate, formatMoney, addTransaction } from "../../utils/helpers.js";
import { vehicleEmbed, errorEmbed, successEmbed, prisonEmbed } from "../../utils/embeds.js";

const DEALERSHIP = [
  { name: "Honda Civic", brand: "Honda", model: "Civic", type: "car", price: 25000, tier: "standard", stats: { speed: 60, handling: 65, durability: 70 } },
  { name: "Toyota Camry", brand: "Toyota", model: "Camry", type: "car", price: 32000, tier: "standard", stats: { speed: 65, handling: 70, durability: 75 } },
  { name: "BMW M3", brand: "BMW", model: "M3", type: "car", price: 120000, tier: "premium", stats: { speed: 85, handling: 90, durability: 80 } },
  { name: "Lamborghini Huracan", brand: "Lamborghini", model: "Huracan", type: "supercar", price: 500000, tier: "luxury", isVip: true, isLuxury: true, stats: { speed: 98, handling: 95, durability: 70 } },
  { name: "Ford F-150", brand: "Ford", model: "F-150", type: "truck", price: 45000, tier: "standard", stats: { speed: 55, handling: 55, durability: 90 } },
  { name: "Ducati Monster", brand: "Ducati", model: "Monster", type: "motorcycle", price: 18000, tier: "standard", stats: { speed: 80, handling: 75, durability: 50 } },
  { name: "Police Cruiser", brand: "Ford", model: "Crown Victoria", type: "police", price: 60000, tier: "special", stats: { speed: 75, handling: 80, durability: 85 } },
];

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("vehicle")
    .setDescription("Vehicle dealership and management")
    .addSubcommand((s) => s.setName("dealership").setDescription("Browse vehicles for sale"))
    .addSubcommand((s) =>
      s.setName("buy").setDescription("Buy a vehicle")
        .addStringOption((o) => o.setName("name").setDescription("Vehicle name from dealership").setRequired(true))
    )
    .addSubcommand((s) => s.setName("garage").setDescription("View your vehicles"))
    .addSubcommand((s) =>
      s.setName("sell").setDescription("Sell a vehicle")
        .addStringOption((o) => o.setName("plate").setDescription("License plate").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("register").setDescription("Register a vehicle")
        .addStringOption((o) => o.setName("plate").setDescription("License plate").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("insure").setDescription("Get insurance for a vehicle")
        .addStringOption((o) => o.setName("plate").setDescription("License plate").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);

    if (isPrisoned(user.prisonEnd) && ["buy", "sell"].includes(sub)) {
      return interaction.reply({ embeds: [prisonEmbed("In Prison", "You cannot buy or sell vehicles while in prison.")], ephemeral: true });
    }

    if (sub === "dealership") {
      const embed = vehicleEmbed("🚗 Vehicle Dealership", "Browse our selection of vehicles");
      for (const v of DEALERSHIP) {
        embed.addFields({
          name: `${v.isLuxury ? "💎 " : "🚗 "}${v.name}`,
          value: `Price: **${formatMoney(v.price)}** | Speed: ${v.stats.speed} | Handling: ${v.stats.handling} | Durability: ${v.stats.durability}${v.isVip ? " | **VIP Only**" : ""}`,
        });
      }
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "buy") {
      const name = interaction.options.getString("name", true);
      const listing = DEALERSHIP.find((v) => v.name.toLowerCase() === name.toLowerCase());
      if (!listing) return interaction.reply({ embeds: [errorEmbed("Not Found", "That vehicle is not in our dealership.")], ephemeral: true });

      if ((listing as any).isVip && user.vip.tier === "none") {
        return interaction.reply({ embeds: [errorEmbed("VIP Required", "This vehicle is VIP-exclusive.")], ephemeral: true });
      }

      const eco = await Economy.findOne({ userId: interaction.user.id, guildId: interaction.guildId });
      if (!eco || eco.wallet < listing.price) {
        return interaction.reply({ embeds: [errorEmbed("Insufficient Funds", `This vehicle costs **${formatMoney(listing.price)}**.`)], ephemeral: true });
      }

      const plate = generatePlate();
      const vid = generateId("VEH-");
      await Vehicle.create({
        vehicleId: vid,
        guildId: interaction.guildId,
        ownerId: interaction.user.id,
        name: listing.name,
        model: listing.model,
        brand: listing.brand,
        type: listing.type,
        tier: listing.tier,
        price: listing.price,
        isLuxury: (listing as any).isLuxury ?? false,
        isVip: (listing as any).isVip ?? false,
        licensePlate: plate,
        isRegistered: false,
        stats: listing.stats,
      });

      eco.wallet -= listing.price;
      eco.totalSpent += listing.price;
      await eco.save();
      await addTransaction(interaction.user.id, interaction.guildId!, "vehicle_buy", -listing.price, `Bought ${listing.name}`);

      return interaction.reply({
        embeds: [
          successEmbed("Vehicle Purchased!", `You bought a **${listing.name}**!`)
            .addFields(
              { name: "🚗 Vehicle", value: listing.name, inline: true },
              { name: "🔖 Plate", value: plate, inline: true },
              { name: "💰 Paid", value: formatMoney(listing.price), inline: true },
            )
            .setFooter({ text: "Use /vehicle register to register your vehicle!" }),
        ],
      });
    }

    if (sub === "garage") {
      const vehicles = await Vehicle.find({ ownerId: interaction.user.id, guildId: interaction.guildId });
      if (!vehicles.length) return interaction.reply({ embeds: [errorEmbed("Empty Garage", "You don't own any vehicles.")], ephemeral: true });

      const embed = vehicleEmbed("🚗 My Garage", `You own **${vehicles.length}** vehicle(s)`);
      for (const v of vehicles) {
        embed.addFields({
          name: `${v.isLuxury ? "💎" : "🚗"} ${v.name}`,
          value: `Plate: \`${v.licensePlate}\` | Registered: ${v.isRegistered ? "✅" : "❌"} | Insured: ${v.isInsured ? "✅" : "❌"}`,
        });
      }
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "sell") {
      const plate = interaction.options.getString("plate", true).toUpperCase();
      const vehicle = await Vehicle.findOne({ licensePlate: plate, ownerId: interaction.user.id, guildId: interaction.guildId });
      if (!vehicle) return interaction.reply({ embeds: [errorEmbed("Not Found", "You don't own a vehicle with that plate.")], ephemeral: true });

      const salePrice = Math.floor(vehicle.price * 0.6);
      const eco = await Economy.findOne({ userId: interaction.user.id, guildId: interaction.guildId });
      if (eco) {
        eco.wallet += salePrice;
        eco.totalEarned += salePrice;
        await eco.save();
        await addTransaction(interaction.user.id, interaction.guildId!, "vehicle_sell", salePrice, `Sold ${vehicle.name}`);
      }
      await vehicle.deleteOne();
      return interaction.reply({ embeds: [successEmbed("Vehicle Sold", `You sold your **${vehicle.name}** for **${formatMoney(salePrice)}**.`)] });
    }

    if (sub === "register") {
      const plate = interaction.options.getString("plate", true).toUpperCase();
      const vehicle = await Vehicle.findOne({ licensePlate: plate, ownerId: interaction.user.id, guildId: interaction.guildId });
      if (!vehicle) return interaction.reply({ embeds: [errorEmbed("Not Found", "Vehicle not found.")], ephemeral: true });
      if (vehicle.isRegistered) return interaction.reply({ embeds: [errorEmbed("Already Registered", "This vehicle is already registered.")], ephemeral: true });

      const regFee = 500;
      const eco = await Economy.findOne({ userId: interaction.user.id, guildId: interaction.guildId });
      if (!eco || eco.wallet < regFee) return interaction.reply({ embeds: [errorEmbed("Insufficient Funds", `Registration costs **${formatMoney(regFee)}**.`)], ephemeral: true });
      eco.wallet -= regFee;
      await eco.save();
      vehicle.isRegistered = true;
      await vehicle.save();
      return interaction.reply({ embeds: [successEmbed("Vehicle Registered", `**${vehicle.name}** (${plate}) is now registered. Fee: ${formatMoney(regFee)}.`)] });
    }

    if (sub === "insure") {
      const plate = interaction.options.getString("plate", true).toUpperCase();
      const vehicle = await Vehicle.findOne({ licensePlate: plate, ownerId: interaction.user.id, guildId: interaction.guildId });
      if (!vehicle) return interaction.reply({ embeds: [errorEmbed("Not Found", "Vehicle not found.")], ephemeral: true });
      if (vehicle.isInsured) return interaction.reply({ embeds: [errorEmbed("Already Insured", "This vehicle is already insured.")], ephemeral: true });

      const insuranceFee = Math.floor(vehicle.price * 0.05);
      const eco = await Economy.findOne({ userId: interaction.user.id, guildId: interaction.guildId });
      if (!eco || eco.wallet < insuranceFee) return interaction.reply({ embeds: [errorEmbed("Insufficient Funds", `Insurance costs **${formatMoney(insuranceFee)}**.`)], ephemeral: true });
      eco.wallet -= insuranceFee;
      await eco.save();
      vehicle.isInsured = true;
      vehicle.insuranceExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await vehicle.save();
      return interaction.reply({ embeds: [successEmbed("Insured!", `**${vehicle.name}** is now insured for 30 days.`)] });
    }
  },
};
