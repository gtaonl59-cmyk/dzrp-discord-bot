import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

const LISTINGS = [
  { id: 'apartment_1', name: 'Studio Apartment', price: 5000, rent: 100, desc: 'A cozy studio in the city center.' },
  { id: 'apartment_2', name: '2-Bedroom Apartment', price: 12000, rent: 200, desc: 'Spacious apartment with a great view.' },
  { id: 'house_1', name: 'Suburban House', price: 35000, rent: 400, desc: 'A nice house in a quiet neighborhood.' },
  { id: 'house_2', name: 'Luxury House', price: 80000, rent: 800, desc: 'High-end house with a pool and garden.' },
  { id: 'villa', name: 'Beach Villa', price: 150000, rent: 1500, desc: 'Stunning villa overlooking the ocean.' },
  { id: 'warehouse', name: 'Warehouse', price: 40000, rent: 500, desc: 'Industrial warehouse for storage or business.' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('property')
    .setDescription('Buy and manage properties')
    .addSubcommand(s => s.setName('listings').setDescription('View available properties'))
    .addSubcommand(s => s.setName('buy').setDescription('Buy a property')
      .addStringOption(o => {
        o.setName('property').setDescription('Property to buy').setRequired(true);
        LISTINGS.forEach(p => o.addChoices({ name: p.name, value: p.id }));
        return o;
      }))
    .addSubcommand(s => s.setName('myproperties').setDescription('View your owned properties'))
    .addSubcommand(s => s.setName('sell').setDescription('Sell a property')
      .addStringOption(o => {
        o.setName('property').setDescription('Property to sell').setRequired(true);
        LISTINGS.forEach(p => o.addChoices({ name: p.name, value: p.id }));
        return o;
      })),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const owned = getUser('properties', userId, { owned: [] });
    const eco = getUser('economy', userId, { wallet: 0, bank: 0 });

    if (sub === 'listings') {
      const desc = LISTINGS.map(p =>
        `**${p.name}** — 💰 $${p.price.toLocaleString()} | 📈 +$${p.rent}/day\n*${p.desc}*`
      ).join('\n\n');
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🏠 Property Listings').setColor(0xe67e22).setDescription(desc)],
        ephemeral: true,
      });
    }

    if (sub === 'buy') {
      const propId = interaction.options.getString('property');
      const prop = LISTINGS.find(p => p.id === propId);
      if (!prop) return interaction.reply({ content: '❌ Property not found.', ephemeral: true });
      if (owned.owned.includes(propId)) return interaction.reply({ content: '❌ You already own this property.', ephemeral: true });

      const prison = getUser('prison', userId, { jailed: false });
      if (prison.jailed && prison.release > Date.now()) return interaction.reply({ content: '🔒 You cannot buy property while in prison.', ephemeral: true });

      const total = (eco.wallet ?? 0) + (eco.bank ?? 0);
      if (total < prop.price) return interaction.reply({ content: `❌ You need $${prop.price.toLocaleString()}. You have $${total.toLocaleString()}.`, ephemeral: true });

      // Deduct from wallet first, then bank
      let remaining = prop.price;
      if (eco.wallet >= remaining) { eco.wallet -= remaining; remaining = 0; }
      else { remaining -= eco.wallet; eco.wallet = 0; eco.bank -= remaining; }

      owned.owned.push(propId);
      saveUser('properties', userId, owned);
      saveUser('economy', userId, eco);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🏠 Property Purchased!').setColor(0x2ecc71)
          .setDescription(`You now own **${prop.name}**!\nEarns **$${prop.rent}/day** passively.`)],
      });
    }

    if (sub === 'myproperties') {
      if (!owned.owned.length) return interaction.reply({ content: '❌ You don\'t own any properties yet.', ephemeral: true });
      const desc = owned.owned.map(id => {
        const p = LISTINGS.find(p => p.id === id);
        return p ? `🏠 **${p.name}** — +$${p.rent}/day` : `🏠 ${id}`;
      }).join('\n');
      const totalRent = owned.owned.reduce((sum, id) => sum + (LISTINGS.find(p => p.id === id)?.rent ?? 0), 0);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🏠 My Properties').setColor(0xe67e22)
          .setDescription(desc)
          .setFooter({ text: `Total passive income: $${totalRent}/day` })],
      });
    }

    if (sub === 'sell') {
      const propId = interaction.options.getString('property');
      const prop = LISTINGS.find(p => p.id === propId);
      if (!prop) return interaction.reply({ content: '❌ Property not found.', ephemeral: true });
      if (!owned.owned.includes(propId)) return interaction.reply({ content: '❌ You don\'t own this property.', ephemeral: true });
      const sellPrice = Math.floor(prop.price * 0.7);
      owned.owned = owned.owned.filter(id => id !== propId);
      eco.wallet = (eco.wallet ?? 0) + sellPrice;
      saveUser('properties', userId, owned);
      saveUser('economy', userId, eco);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🏠 Property Sold').setColor(0x95a5a6)
          .setDescription(`Sold **${prop.name}** for **$${sellPrice.toLocaleString()}** (70% of purchase price).`)],
      });
    }
  },
};
