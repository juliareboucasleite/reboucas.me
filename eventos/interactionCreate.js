const { Events, MessageFlags } = require('discord.js');
const { ehAdmin } = require('../backend/utils/jsonStore');
const {
  handleVerifyButton,
  handlePrecosButton,
  handleTicketClose,
  handleGiveawayButton,
} = require('../backend/utils/featureService');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // ----- BOTÕES -----
    if (interaction.isButton()) {
      const id = interaction.customId;
      try {
        if (id === 'paw:verify') return handleVerifyButton(interaction);
        if (id === 'paw:ticket-close') return handleTicketClose(interaction);
        if (id.startsWith('paw:precos:')) {
          const method = id.split(':')[2];
          return handlePrecosButton(interaction, method);
        }
        if (id.startsWith('paw:gw:')) {
          const sorteioId = id.slice('paw:gw:'.length);
          return handleGiveawayButton(interaction, sorteioId);
        }
      } catch (err) {
        console.error(`[botão ${id}]`, err);
        const resposta = {
          content: 'something went wrong handling that action.',
          flags: MessageFlags.Ephemeral,
        };
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(resposta).catch(() => {});
        } else {
          await interaction.reply(resposta).catch(() => {});
        }
      }
      return;
    }

    // ----- SLASH COMMANDS -----
    if (!interaction.isChatInputCommand()) return;

    const comando = client.comandos.get(interaction.commandName);
    if (!comando) return;

    if (comando.categoria === 'admin' && !ehAdmin(interaction.user.id)) {
      return interaction.reply({
        content: 'This command is restricted to Pawshop admins.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await comando.execute(interaction, client);
    } catch (erro) {
      console.error(`[comando ${interaction.commandName}]`, erro);
      const resposta = {
        content: 'Something went wrong running this command.',
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
