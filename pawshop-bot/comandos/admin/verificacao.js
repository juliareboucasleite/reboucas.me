const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildVerifyPanel } = require('../../backend/utils/featureService');
const { lerConfigGuild } = require('../../backend/utils/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificacao')
    .setDescription('[Admin] Post the verification panel in the current channel.'),
  async execute(interaction) {
    const config = lerConfigGuild(interaction.guildId);
    if (!config.verification?.roleId) {
      return interaction.reply({
        content:
          'set up the verification role first in the admin panel → "Verificação" section.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.channel.send(buildVerifyPanel(config));
    await interaction.reply({
      content: 'verification panel posted ✦',
      flags: MessageFlags.Ephemeral,
    });
  },
};
