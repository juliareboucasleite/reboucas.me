const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { lerProdutos } = require('../../backend/utils/jsonStore');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('catalogo')
    .setDescription('Mostra os produtos da Pawshop.')
    .addStringOption((op) =>
      op
        .setName('categoria')
        .setDescription('Filtra por categoria')
        .addChoices(
          { name: 'Roupas', value: 'roupas' },
          { name: 'UGC', value: 'ugc' },
          { name: 'Bots', value: 'bots' },
        ),
    ),
  async execute(interaction) {
    const filtro = interaction.options.getString('categoria');
    const todos = lerProdutos();
    const lista = filtro ? todos.filter((p) => p.categoria === filtro) : todos;

    if (lista.length === 0) {
      return interaction.reply({ content: 'Nenhum produto encontrado.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Catálogo · ${config.loja.nome}`)
      .setDescription(filtro ? `Categoria: **${filtro}**` : 'Todos os produtos disponíveis.')
      .setColor(config.loja.cor)
      .setFooter({ text: config.loja.descricao });

    for (const p of lista.slice(0, 25)) {
      embed.addFields({
        name: `${p.nome} — ${p.preco} ${p.moeda}`,
        value: `${p.descricao}\n${p.link ? `[Ver no Roblox](${p.link})` : ''}`,
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
