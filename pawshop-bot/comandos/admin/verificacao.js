const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { lerConfigGuild, DEFAULT_VERIFY_CHANNEL_ID } = require('../../backend/utils/jsonStore');
const { ensureVerifyPanel } = require('../../backend/utils/featureService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificacao')
    .setDescription('[Admin] Posta ou atualiza o painel de verificacao no canal configurado.'),
  async execute(interaction, client) {
    const config = lerConfigGuild(interaction.guildId);
    if (!config.verification?.roleIds || config.verification.roleIds.length === 0) {
      return interaction.reply({
        content: 'Configure ao menos um cargo na secao "Verificacao" do painel admin primeiro.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const result = await ensureVerifyPanel(
      client,
      interaction.guildId,
      config.verification?.channelId || DEFAULT_VERIFY_CHANNEL_ID,
    );

    await interaction.reply({
      content: `Painel de verificacao atualizado em <#${result.channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
