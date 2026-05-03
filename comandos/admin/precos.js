const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildPrecosPanel } = require('../../backend/utils/featureService');
const { lerConfigGuild } = require('../../backend/utils/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('precos')
    .setDescription('[Admin] Post the price list panel in the current channel.'),
  async execute(interaction) {
    const config = lerConfigGuild(interaction.guildId);
    await interaction.channel.send(buildPrecosPanel(config));
    await interaction.reply({
      content: 'price panel posted ✦',
      flags: MessageFlags.Ephemeral,
    });
  },
};
