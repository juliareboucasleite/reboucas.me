const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const {
  buildMemberEmbed,
  createBrandFiles,
} = require('../../backend/utils/discordAdmin');
const { lerConfigGuild } = require('../../backend/utils/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-preview')
    .setDescription('[Admin] Envia um preview da mensagem de welcome neste canal.'),
  async execute(interaction) {
    const config = lerConfigGuild(interaction.guildId);
    const embed = buildMemberEmbed(
      'welcome',
      interaction.guild,
      interaction.user,
      interaction.guild.memberCount,
      config,
    );

    await interaction.channel.send({
      embeds: [embed],
      files: createBrandFiles('welcome'),
    });

    await interaction.reply({
      content: 'Preview de welcome enviado neste canal.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
