const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Mostra a latência do bot.'),
  async execute(interaction) {
    const enviado = await interaction.reply({ content: 'Medindo...', fetchReply: true });
    const latencia = enviado.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(
      `Pong! \`${latencia}ms\` · API \`${Math.round(interaction.client.ws.ping)}ms\``,
    );
  },
};
