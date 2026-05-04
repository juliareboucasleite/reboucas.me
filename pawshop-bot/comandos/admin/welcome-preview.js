const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const {
  buildMemberEmbed,
  createBrandFiles,
} = require('../../backend/utils/discordAdmin');
const { lerConfigGuild } = require('../../backend/utils/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-preview')
    .setDescription('[Admin] Send a welcome message preview in this channel.'),
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
      content: 'Welcome preview sent in this channel.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
