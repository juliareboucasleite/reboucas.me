const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildSupportPanel } = require('../../backend/utils/featureService');
const { lerConfigGuild } = require('../../backend/utils/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suporte')
    .setDescription('[Admin] Post a support panel in the current channel.')
    .addStringOption((option) =>
      option
        .setName('tipo')
        .setDescription('Which panel to post')
        .setRequired(true)
        .addChoices(
          { name: 'help', value: 'help' },
          { name: 'information', value: 'info' },
        ),
    ),
  async execute(interaction) {
    const config = lerConfigGuild(interaction.guildId);
    const kind = interaction.options.getString('tipo', true);
    await interaction.channel.send(buildSupportPanel(config, kind));
    await interaction.reply({
      content: `${kind === 'info' ? 'information' : 'help'} panel posted`,
      flags: MessageFlags.Ephemeral,
    });
  },
};