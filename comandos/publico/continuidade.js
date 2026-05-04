const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { lerTicketTracking, atualizarTicketTracking } = require('../../backend/utils/jsonStore');

const ROLE_CONTINUIDADE_ID = '1492998062858174544';

function lerTipoTicket(channel) {
  const topic = String(channel?.topic || '');
  const match = topic.match(/^pawshop-ticket:([^:]+):/i);
  return match ? match[1].toLowerCase() : '';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('continuidade')
    .setDescription('Recebe o cargo de continuidade dentro de um ticket de preços.'),
  async execute(interaction) {
    const channel = interaction.channel;
    const ticketKind = lerTipoTicket(channel);

    if (ticketKind !== 'prices') {
      return interaction.reply({
        content: 'Use este comando apenas dentro de um ticket de preços.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const tracking = lerTicketTracking()[String(channel.id)] ?? null;
    if (!tracking || Number(tracking.messageCount || 0) < 10) {
      const faltam = Math.max(0, 10 - Number(tracking?.messageCount || 0));
      return interaction.reply({
        content: faltam > 0 ? `Ainda faltam ${faltam} mensagem(ns) para liberar a continuidade.` : 'Ainda não há mensagens suficientes neste ticket.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (interaction.member.roles.cache.has(ROLE_CONTINUIDADE_ID)) {
      return interaction.reply({
        content: 'Você já tem o cargo de continuidade.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await interaction.member.roles.add(ROLE_CONTINUIDADE_ID, 'Continuidade solicitada via ticket de preços');
      await atualizarTicketTracking(channel.id, { continuityGranted: true });
      await interaction.reply({
        content: 'Cargo de continuidade concedido. Pode continuar por aqui ✦',
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await interaction.reply({
        content: `Não consegui conceder o cargo de continuidade: ${error.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};