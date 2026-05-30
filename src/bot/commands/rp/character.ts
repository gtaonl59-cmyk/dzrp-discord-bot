import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import Character from "../../models/Character.js";
import { getOrCreateUser, generateId } from "../../utils/helpers.js";
import { rpEmbed, errorEmbed, successEmbed } from "../../utils/embeds.js";
import { Colors } from "../../utils/embeds.js";

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("character")
    .setDescription("Manage your RP characters")
    .addSubcommand((s) =>
      s.setName("create").setDescription("Create a new character")
        .addStringOption((o) => o.setName("name").setDescription("Character name").setRequired(true))
        .addIntegerOption((o) => o.setName("age").setDescription("Character age").setRequired(true).setMinValue(18).setMaxValue(99))
        .addStringOption((o) =>
          o.setName("gender").setDescription("Gender").setRequired(true)
            .addChoices({ name: "Male", value: "Male" }, { name: "Female", value: "Female" }, { name: "Other", value: "Other" })
        )
        .addStringOption((o) => o.setName("biography").setDescription("Character biography").setRequired(false))
    )
    .addSubcommand((s) => s.setName("list").setDescription("List all your characters"))
    .addSubcommand((s) =>
      s.setName("view").setDescription("View a character")
        .addStringOption((o) => o.setName("name").setDescription("Character name").setRequired(false))
        .addUserOption((o) => o.setName("user").setDescription("View another user's active character").setRequired(false))
    )
    .addSubcommand((s) =>
      s.setName("switch").setDescription("Switch your active character")
        .addStringOption((o) => o.setName("name").setDescription("Character name to activate").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("edit").setDescription("Edit your active character")
        .addStringOption((o) => o.setName("biography").setDescription("New biography").setRequired(false))
        .addStringOption((o) => o.setName("photo").setDescription("Photo URL").setRequired(false))
    )
    .addSubcommand((s) =>
      s.setName("delete").setDescription("Delete a character")
        .addStringOption((o) => o.setName("name").setDescription("Character name to delete").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      const name = interaction.options.getString("name", true);
      const age = interaction.options.getInteger("age", true);
      const gender = interaction.options.getString("gender", true);
      const biography = interaction.options.getString("biography") ?? "";

      const existing = await Character.countDocuments({ userId: interaction.user.id, guildId: interaction.guildId });
      if (existing >= 5) {
        return interaction.reply({ embeds: [errorEmbed("Limit Reached", "You can only have up to **5 characters**.")], ephemeral: true });
      }

      const nameTaken = await Character.findOne({ guildId: interaction.guildId, name });
      if (nameTaken) {
        return interaction.reply({ embeds: [errorEmbed("Name Taken", `The name **${name}** is already taken.`)], ephemeral: true });
      }

      // Deactivate existing characters
      await Character.updateMany({ userId: interaction.user.id, guildId: interaction.guildId }, { isActive: false });

      const char = await Character.create({
        userId: interaction.user.id,
        guildId: interaction.guildId,
        name, age, gender, biography,
        isActive: true,
      });

      return interaction.reply({
        embeds: [
          rpEmbed("Character Created!", `Welcome to the city, **${name}**!`)
            .addFields(
              { name: "👤 Name", value: name, inline: true },
              { name: "🎂 Age", value: `${age}`, inline: true },
              { name: "⚧ Gender", value: gender, inline: true },
              { name: "📖 Bio", value: biography || "No biography set.", inline: false },
            )
            .setFooter({ text: "Use /character edit to update your photo and bio" }),
        ],
      });
    }

    if (sub === "list") {
      const chars = await Character.find({ userId: interaction.user.id, guildId: interaction.guildId });
      if (!chars.length) return interaction.reply({ embeds: [errorEmbed("No Characters", "You have no characters. Use `/character create` to make one.")], ephemeral: true });

      const embed = rpEmbed("Your Characters", `You have **${chars.length}/5** characters`);
      for (const c of chars) {
        embed.addFields({
          name: `${c.isActive ? "▶️" : "⏸️"} ${c.name} ${c.isDead ? "💀" : ""}`,
          value: `Age: ${c.age} | Gender: ${c.gender} | Job: ${c.job} | Rep: ${c.reputation}`,
        });
      }
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "view") {
      const targetUser = interaction.options.getUser("user");
      const charName = interaction.options.getString("name");

      let char;
      if (targetUser) {
        char = await Character.findOne({ userId: targetUser.id, guildId: interaction.guildId, isActive: true });
      } else if (charName) {
        char = await Character.findOne({ guildId: interaction.guildId, name: charName });
      } else {
        char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, isActive: true });
      }

      if (!char) return interaction.reply({ embeds: [errorEmbed("Not Found", "Character not found.")], ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(char.isDead ? Colors.error : Colors.rp)
        .setTitle(`${char.isDead ? "💀" : "🎭"} ${char.name}`)
        .setDescription(char.biography || "*No biography provided.*")
        .addFields(
          { name: "🎂 Age", value: `${char.age}`, inline: true },
          { name: "⚧ Gender", value: char.gender, inline: true },
          { name: "💼 Job", value: char.job, inline: true },
          { name: "⭐ Reputation", value: `${char.reputation}`, inline: true },
          { name: "📦 Inventory", value: `${char.inventory.length} items`, inline: true },
          { name: "🎫 Licenses", value: char.licenses.length ? char.licenses.join(", ") : "None", inline: true },
          { name: "💪 Strength", value: `${char.stats.strength}`, inline: true },
          { name: "🧠 Intelligence", value: `${char.stats.intelligence}`, inline: true },
          { name: "✨ Charisma", value: `${char.stats.charisma}`, inline: true },
        )
        .setTimestamp();

      if (char.photo) embed.setThumbnail(char.photo);
      if (char.isDead) embed.setFooter({ text: `Died: ${char.deathReason}` });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "switch") {
      const name = interaction.options.getString("name", true);
      const char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, name });
      if (!char) return interaction.reply({ embeds: [errorEmbed("Not Found", "You don't have a character with that name.")], ephemeral: true });
      if (char.isDead) return interaction.reply({ embeds: [errorEmbed("Dead", "You cannot play as a dead character.")], ephemeral: true });

      await Character.updateMany({ userId: interaction.user.id, guildId: interaction.guildId }, { isActive: false });
      char.isActive = true;
      await char.save();
      return interaction.reply({ embeds: [successEmbed("Character Switched", `You are now playing as **${char.name}**.`)] });
    }

    if (sub === "edit") {
      const char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, isActive: true });
      if (!char) return interaction.reply({ embeds: [errorEmbed("No Active Character", "You have no active character.")], ephemeral: true });

      const bio = interaction.options.getString("biography");
      const photo = interaction.options.getString("photo");
      if (bio) char.biography = bio;
      if (photo) char.photo = photo;
      await char.save();
      return interaction.reply({ embeds: [successEmbed("Character Updated", `**${char.name}** has been updated.`)] });
    }

    if (sub === "delete") {
      const name = interaction.options.getString("name", true);
      const char = await Character.findOne({ userId: interaction.user.id, guildId: interaction.guildId, name });
      if (!char) return interaction.reply({ embeds: [errorEmbed("Not Found", "Character not found.")], ephemeral: true });
      await char.deleteOne();
      return interaction.reply({ embeds: [successEmbed("Character Deleted", `**${name}** has been permanently deleted.`)] });
    }
  },
};
