const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildSupportPanel } = require('../../backend/utils/featureService');
const { lerConfigGuild } = require('../../backend/utils/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suporte')
    .setDescription('[Admin] Post a support panel with a ticket button in the current channel.'),
  async execute(interaction) {
    const config = lerConfigGuild(interaction.guildId);
    await interaction.channel.send(buildSupportPanel(config));
    await interaction.reply({
      content: 'support panel posted ✦',
      flags: MessageFlags.Ephemeral,
    });
  },
};