export default {
  data: {
    name: 'casino',
    description: 'دخول الكازينو'
  },
  async execute(interaction) {
    await interaction.reply({content:'🎰 مرحبا بك في الكازينو!', ephemeral:true});
  }
}
