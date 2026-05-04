const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { lerProdutos } = require('../../backend/utils/jsonStore');
const config = require('../../config/config.json');

function formatCurrency(code) {
  switch (String(code || '').toLowerCase()) {
    case 'brl':
      return 'R$';
    case 'eur':
      return '€';
    case 'usd':
      return '$';
    case 'robux':
      return 'Robux';
    default:
      return String(code || '').toUpperCase();
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('catalogo')
    .setDescription('Show the Pawshop catalog.')
    .addStringOption((op) =>
      op
        .setName('categoria')
        .setDescription('Filter by category')
        .addChoices(
          { name: 'Clothes', value: 'roupas' },
          { name: 'UGC', value: 'ugc' },
          { name: 'Bots', value: 'bots' },
        ),
    ),
  async execute(interaction) {
    const filtro = interaction.options.getString('categoria');
    const todos = lerProdutos();
    const lista = filtro ? todos.filter((p) => p.categoria === filtro) : todos;

    if (lista.length === 0) {
      return interaction.reply({ content: 'No products found.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Catalog · ${config.loja.nome}`)
      .setDescription(filtro ? `Category: **${filtro}**` : 'All available products.')
      .setColor(config.loja.cor)
      .setFooter({ text: config.loja.descricao });

    for (const p of lista.slice(0, 25)) {
      embed.addFields({
        name: `${p.nome} — ${p.preco} ${formatCurrency(p.moeda)}`,
        value: `${p.descricao}\n${p.link ? `[View on Roblox](${p.link})` : ''}`,
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
