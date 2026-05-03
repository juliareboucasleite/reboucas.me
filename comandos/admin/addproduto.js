const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { lerProdutos, salvarProdutos } = require('../../backend/utils/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addproduto')
    .setDescription('[Admin] Adiciona um produto ao catálogo.')
    .addStringOption((op) => op.setName('nome').setDescription('Nome do produto').setRequired(true))
    .addStringOption((op) =>
      op
        .setName('categoria')
        .setDescription('Categoria')
        .setRequired(true)
        .addChoices(
          { name: 'Roupas', value: 'roupas' },
          { name: 'UGC', value: 'ugc' },
          { name: 'Bots', value: 'bots' },
        ),
    )
    .addIntegerOption((op) =>
      op.setName('preco').setDescription('Preço').setRequired(true).setMinValue(0),
    )
    .addStringOption((op) =>
      op
        .setName('moeda')
        .setDescription('Moeda')
        .addChoices(
          { name: 'Robux', value: 'robux' },
          { name: 'BRL', value: 'brl' },
        ),
    )
    .addStringOption((op) => op.setName('link').setDescription('Link do produto'))
    .addStringOption((op) => op.setName('descricao').setDescription('Descrição curta')),
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
      content: `Produto **${novo.nome}** adicionado (id \`${novo.id}\`).`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
