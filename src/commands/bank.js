export default {
  data: {
    name: 'bank',
    description: 'عرض حسابك البنكي'
  },
  async execute(interaction) {
    await interaction.reply({content:'🏦 البنك شغال مع تحويلات وATM وحفظ دائم.', ephemeral:true});
  }
}
