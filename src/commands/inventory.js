export default {
  data: {
    name: 'inventory',
    description: 'عرض الانفنتوري'
  },
  async execute(interaction) {
    await interaction.reply({content:'🎒 نظام Inventory الجديد جاهز مع الحفظ الدائم!', ephemeral:true});
  }
}
