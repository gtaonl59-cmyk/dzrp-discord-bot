
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, createUser, removeMoney, saveUser } from "../database.js";

const CARS = {
  BMW: 500000,
  GTR: 1000000,
  Lambo: 2500000
};

export default {
  data: new SlashCommandBuilder()
    .setName("buycar")
    .setDescription("شراء سيارة")
    .addStringOption(o =>
      o.setName("name")
       .setDescription("اسم السيارة")
       .setRequired(true)
       .addChoices(
         { name: "BMW", value: "BMW" },
         { name: "GTR", value: "GTR" },
         { name: "Lambo", value: "Lambo" }
       )
    ),

  async execute(interaction) {
    let user = getUser(interaction.user.id);

    if (!user) {
      user = createUser(interaction.user.id, interaction.user.username);
    }

    const name = interaction.options.getString("name");
    const price = CARS[name];

    if (user.balance < price) {
      return interaction.reply({
        content: "❌ فلوسك ما تكفيش",
        ephemeral: true
      });
    }

    removeMoney(interaction.user.id, price, "Car", interaction.user.id);

    const cars = user.cars || [];
    cars.push(name);

    saveUser(interaction.user.id, { cars });

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("🚗 تم شراء سيارة")
          .setDescription(`اشتريت ${name}`)
      ]
    });
  }
};
