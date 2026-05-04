const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Show the bot latency.'),
  async execute(interaction) {
    const enviado = await interaction.reply({ content: 'Measuring...', fetchReply: true });
    const latencia = enviado.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(
      `Pong! \`${latencia}ms\` · API \`${Math.round(interaction.client.ws.ping)}ms\``,
    );
  },
};
