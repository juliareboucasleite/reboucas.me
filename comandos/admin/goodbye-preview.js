const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const {
  buildMemberEmbed,
  createBrandFiles,
} = require('../../backend/utils/discordAdmin');
const { lerConfigGuild } = require('../../backend/utils/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('goodbye-preview')
    .setDescription('[Admin] Envia um preview da mensagem de saida neste canal.'),
  async execute(interaction) {
    const config = lerConfigGuild(interaction.guildId);
    const embed = buildMemberEmbed(
      'goodbye',
      interaction.guild,
      interaction.user,
      interaction.guild.memberCount,
      config,
    );

    await interaction.channel.send({
      embeds: [embed],
      files: createBrandFiles('goodbye'),
    });

    await interaction.reply({
      content: 'Preview de bye enviado neste canal.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
