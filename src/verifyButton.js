import {
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,

  async execute(client) {

    const channelId = "حط_ID_تاع_psn-verify";

    const channel = await client.channels.fetch(channelId);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify_btn")
        .setLabel("تأكيد الحساب")
        .setStyle(ButtonStyle.Success)
    );

    channel.send({
      content: "اضغط على الزر لتأكيد حسابك",
      components: [row],
    });
  }
};
