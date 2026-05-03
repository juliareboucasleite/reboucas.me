const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { lerProdutos, salvarProdutos } = require('../../backend/utils/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addproduto')
    .setDescription('[Admin] Add a product to the catalog.')
    .addStringOption((op) => op.setName('nome').setDescription('Product name').setRequired(true))
    .addStringOption((op) =>
      op
        .setName('categoria')
        .setDescription('Category')
        .setRequired(true)
        .addChoices(
          { name: 'Clothes', value: 'roupas' },
          { name: 'UGC', value: 'ugc' },
          { name: 'Bots', value: 'bots' },
        ),
    )
    .addIntegerOption((op) =>
      op.setName('preco').setDescription('Price').setRequired(true).setMinValue(0),
    )
    .addStringOption((op) =>
      op
        .setName('moeda')
        .setDescription('Currency')
        .addChoices(
          { name: 'Robux', value: 'robux' },
          { name: 'BRL', value: 'brl' },
        ),
    )
    .addStringOption((op) => op.setName('link').setDescription('Product link'))
    .addStringOption((op) => op.setName('descricao').setDescription('Short description')),
  async execute(interaction) {
    const produtos = lerProdutos();
    const novo = {
      id: `${Date.now()}`,
      nome: interaction.options.getString('nome', true),
      categoria: interaction.options.getString('categoria', true),
      preco: interaction.options.getInteger('preco', true),
      moeda: interaction.options.getString('moeda') ?? 'robux',
      link: interaction.options.getString('link') ?? '',
      descricao: interaction.options.getString('descricao') ?? '',
      imagem: '',
    };
    produtos.push(novo);
    salvarProdutos(produtos);

    await interaction.reply({
      content: `Product **${novo.nome}** added (id \`${novo.id}\`).`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
