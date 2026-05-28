import {
  SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags
} from "discord.js";
import { getUser, createUser, setJob, JOBS } from "../database.js";

const JOB_NAMES = Object.keys(JOBS);

export default {
  data: new SlashCommandBuilder()
    .setName("setjob")
    .setDescription("تعيين وظيفة لعضو (مشرف فقط)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("job")
        .setDescription("الوظيفة")
        .setRequired(true)
        .addChoices(...JOB_NAMES.map((j) => ({ name: `${JOBS[j].emoji} ${j}`, value: j })))
    ),

  prefix: "setjob",

  async execute(interaction, _client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "🚫 هذا الأمر للمشرفين فقط.", flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser("user");
    const job = interaction.options.getString("job");
    const result = await applyJob(interaction.user, target, job);
    await interaction.editReply(result);
  },

  async executePrefix(message, args, _client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply("🚫 هذا الأمر للمشرفين فقط.");
    }
    const target = message.mentions.users.first();
    const job = args[1];
    if (!target || !job || !JOB_NAMES.includes(job)) {
      return message.reply(`❌ استخدم: \`!setjob @عضو <وظيفة>\`\nالوظائف المتاحة: ${JOB_NAMES.join("، ")}`);
    }
    const result = await applyJob(message.author, target, job);
    await message.reply(result);
  },
};

async function applyJob(admin, target, job) {
  const jobData = JOBS[job];
  if (!jobData) return { content: "❌ وظيفة غير معروفة." };

  let dbUser = getUser(target.id);
  if (!dbUser) dbUser = createUser(target.id, target.username);

  setJob(target.id, job);

  return {
    embeds: [
      new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle(`${jobData.emoji} تم تعيين الوظيفة`)
        .addFields(
          { name: "👤 العضو",      value: `<@${target.id}>`,               inline: true },
          { name: "💼 الوظيفة الجديدة", value: `${jobData.emoji} **${job}**`, inline: true },
          { name: "💵 الراتب اليومي", value: `${jobData.salary.toLocaleString()} $`, inline: true },
          { name: "👮 المشرف",     value: `<@${admin.id}>`,                inline: true },
        )
        .setFooter({ text: "DzRP RP System" })
        .setTimestamp(),
    ],
  };
}
