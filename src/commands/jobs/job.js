import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

const JOBS = [
  { id: 'police', name: 'Police Officer', salary: 350, desc: 'Serve and protect the city.' },
  { id: 'medic', name: 'Paramedic', salary: 300, desc: 'Save lives on the front line.' },
  { id: 'mechanic', name: 'Mechanic', salary: 250, desc: 'Fix vehicles at the garage.' },
  { id: 'taxi', name: 'Taxi Driver', salary: 200, desc: 'Drive passengers around the city.' },
  { id: 'dealer', name: 'Car Salesman', salary: 220, desc: 'Sell vehicles at the dealership.' },
  { id: 'chef', name: 'Chef', salary: 230, desc: 'Cook at a high-end restaurant.' },
  { id: 'lawyer', name: 'Lawyer', salary: 400, desc: 'Represent clients in court.' },
  { id: 'judge', name: 'Judge', salary: 450, desc: 'Preside over court cases.' },
  { id: 'reporter', name: 'Reporter', salary: 200, desc: 'Cover stories for the city news.' },
  { id: 'security', name: 'Security Guard', salary: 180, desc: 'Keep order at venues.' },
  { id: 'trucker', name: 'Truck Driver', salary: 260, desc: 'Haul cargo across the city.' },
  { id: 'pilot', name: 'Pilot', salary: 500, desc: 'Fly planes and helicopters.' },
  { id: 'banker', name: 'Banker', salary: 380, desc: 'Manage finances at the bank.' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('job')
    .setDescription('Manage your job')
    .addSubcommand(s => s.setName('list').setDescription('View available jobs'))
    .addSubcommand(s => s.setName('info').setDescription('View your current job'))
    .addSubcommand(s => s.setName('apply').setDescription('Apply for a job')
      .addStringOption(o => {
        o.setName('job').setDescription('Job to apply for').setRequired(true);
        JOBS.forEach(j => o.addChoices({ name: j.name, value: j.id }));
        return o;
      }))
    .addSubcommand(s => s.setName('quit').setDescription('Quit your current job')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const jobData = getUser('jobs', userId, { job: null, appliedAt: null });

    if (sub === 'list') {
      const desc = JOBS.map(j => `**${j.name}** — $${j.salary}/work\n*${j.desc}*`).join('\n\n');
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('💼 Available Jobs').setColor(0x3498db).setDescription(desc)],
        ephemeral: true,
      });
    }

    if (sub === 'info') {
      if (!jobData.job) return interaction.reply({ content: '❌ You are unemployed. Use `/job apply` to get a job.', ephemeral: true });
      const j = JOBS.find(j => j.id === jobData.job);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('💼 Your Job').setColor(0x2ecc71)
          .addFields(
            { name: 'Position', value: j?.name ?? jobData.job, inline: true },
            { name: 'Salary Bonus', value: `$${j?.salary ?? 0}/work`, inline: true },
            { name: 'Description', value: j?.desc ?? '—' },
          )],
      });
    }

    if (sub === 'apply') {
      if (jobData.job) return interaction.reply({ content: '❌ You already have a job. Use `/job quit` first.', ephemeral: true });
      const jobId = interaction.options.getString('job');
      const j = JOBS.find(j => j.id === jobId);
      jobData.job = jobId;
      jobData.appliedAt = Date.now();
      saveUser('jobs', userId, jobData);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('✅ Job Accepted!').setColor(0x2ecc71)
          .setDescription(`You are now a **${j.name}**!\nYou will earn $${j.salary} bonus per `/work`.\n*${j.desc}*`)],
      });
    }

    if (sub === 'quit') {
      if (!jobData.job) return interaction.reply({ content: '❌ You are already unemployed.', ephemeral: true });
      const old = JOBS.find(j => j.id === jobData.job);
      jobData.job = null;
      jobData.appliedAt = null;
      saveUser('jobs', userId, jobData);
      return interaction.reply({ content: `✅ You quit your job as **${old?.name ?? 'Unknown'}**.` });
    }
  },
};
