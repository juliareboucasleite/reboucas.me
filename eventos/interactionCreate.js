const { Events, MessageFlags } = require('discord.js');
const { ehAdmin } = require('../backend/utils/jsonStore');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const comando = client.comandos.get(interaction.commandName);
    if (!comando) return;

    if (comando.categoria === 'admin' && !ehAdmin(interaction.user.id)) {
      return interaction.reply({
        content: 'Esse comando é restrito aos administradores da Pawshop.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await comando.execute(interaction, client);
    } catch (erro) {
      console.error(`[comando ${interaction.commandName}]`, erro);
      const resposta = {
        content: 'Algo deu errado ao executar esse comando.',
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(resposta).catch(() => {});
      } else {
        await interaction.reply(resposta).catch(() => {});
      }
    }
  },
};
