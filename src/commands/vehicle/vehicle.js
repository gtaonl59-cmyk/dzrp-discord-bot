import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

const CARS = [
  { id: 'beater', name: 'Beater Sedan', price: 3000, type: 'Car', speed: '⭐' },
  { id: 'civic', name: 'Honda Civic', price: 8000, type: 'Car', speed: '⭐⭐' },
  { id: 'truck', name: 'Pickup Truck', price: 15000, type: 'Truck', speed: '⭐⭐' },
  { id: 'bmw', name: 'BMW 5-Series', price: 40000, type: 'Car', speed: '⭐⭐⭐' },
  { id: 'motorcycle', name: 'Sport Motorcycle', price: 12000, type: 'Motorcycle', speed: '⭐⭐⭐' },
  { id: 'suv', name: 'Luxury SUV', price: 55000, type: 'SUV', speed: '⭐⭐⭐' },
  { id: 'ferrari', name: 'Ferrari 488', price: 200000, type: 'Supercar', speed: '⭐⭐⭐⭐⭐' },
  { id: 'lambo', name: 'Lamborghini Urus', price: 250000, type: 'Supercar', speed: '⭐⭐⭐⭐⭐' },
  { id: 'heli', name: 'Helicopter', price: 500000, type: 'Aircraft', speed: '⭐⭐⭐⭐⭐' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('vehicle')
    .setDescription('Buy and manage vehicles')
    .addSubcommand(s => s.setName('dealership').setDescription('Browse available vehicles'))
    .addSubcommand(s => s.setName('buy').setDescription('Purchase a vehicle')
      .addStringOption(o => {
        o.setName('vehicle').setDescription('Vehicle to buy').setRequired(true);
        CARS.forEach(c => o.addChoices({ name: c.name, value: c.id }));
        return o;
      }))
    .addSubcommand(s => s.setName('garage').setDescription('View your vehicles'))
    .addSubcommand(s => s.setName('sell').setDescription('Sell a vehicle')
      .addStringOption(o => {
        o.setName('vehicle').setDescription('Vehicle to sell').setRequired(true);
        CARS.forEach(c => o.addChoices({ name: c.name, value: c.id }));
        return o;
      })),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const garage = getUser('vehicles', userId, { owned: [] });
    const eco = getUser('economy', userId, { wallet: 0, bank: 0 });

    if (sub === 'dealership') {
      const desc = CARS.map(c =>
        `**${c.name}** [${c.type}]\n💰 $${c.price.toLocaleString()} | 🚀 ${c.speed}`
      ).join('\n\n');
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🚗 Vehicle Dealership').setColor(0xe74c3c).setDescription(desc)],
        ephemeral: true,
      });
    }

    if (sub === 'buy') {
      const id = interaction.options.getString('vehicle');
      const car = CARS.find(c => c.id === id);
      if (!car) return interaction.reply({ content: '❌ Vehicle not found.', ephemeral: true });
      if (garage.owned.includes(id)) return interaction.reply({ content: '❌ You already own this vehicle.', ephemeral: true });

      const prison = getUser('prison', userId, { jailed: false });
      if (prison.jailed && prison.release > Date.now()) return interaction.reply({ content: '🔒 Cannot buy vehicles while in prison.', ephemeral: true });

      const total = (eco.wallet ?? 0) + (eco.bank ?? 0);
      if (total < car.price) return interaction.reply({ content: `❌ You need $${car.price.toLocaleString()}. You have $${total.toLocaleString()}.`, ephemeral: true });

      let remaining = car.price;
      if (eco.wallet >= remaining) { eco.wallet -= remaining; }
      else { remaining -= eco.wallet; eco.wallet = 0; eco.bank = Math.max(0, (eco.bank ?? 0) - remaining); }

      garage.owned.push(id);
      saveUser('vehicles', userId, garage);
      saveUser('economy', userId, eco);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🚗 Vehicle Purchased!').setColor(0x2ecc71)
          .setDescription(`You bought a **${car.name}** [${car.type}]!\n🚀 Speed: ${car.speed}`)],
      });
    }

    if (sub === 'garage') {
      if (!garage.owned.length) return interaction.reply({ content: '❌ Your garage is empty.', ephemeral: true });
      const desc = garage.owned.map(id => {
        const c = CARS.find(c => c.id === id);
        return c ? `🚗 **${c.name}** [${c.type}] — ${c.speed}` : `🚗 ${id}`;
      }).join('\n');
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🏎️ My Garage').setColor(0xe74c3c).setDescription(desc)],
      });
    }

    if (sub === 'sell') {
      const id = interaction.options.getString('vehicle');
      const car = CARS.find(c => c.id === id);
      if (!car) return interaction.reply({ content: '❌ Vehicle not found.', ephemeral: true });
      if (!garage.owned.includes(id)) return interaction.reply({ content: '❌ You don\'t own this vehicle.', ephemeral: true });
      const sellPrice = Math.floor(car.price * 0.65);
      garage.owned = garage.owned.filter(v => v !== id);
      eco.wallet = (eco.wallet ?? 0) + sellPrice;
      saveUser('vehicles', userId, garage);
      saveUser('economy', userId, eco);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🚗 Vehicle Sold').setColor(0x95a5a6)
          .setDescription(`Sold **${car.name}** for **$${sellPrice.toLocaleString()}**.`)],
      });
    }
  },
};
