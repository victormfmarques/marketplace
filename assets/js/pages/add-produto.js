import { validarLimiteProdutos } from '../modules/regras-produtos.js';
import { cadastrarProduto } from '../modules/produtos.js';
import { mostrarFeedback, previewImagens } from '../modules/ui.js';
import { imageToCompressedBase64 } from '../modules/utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const inputImagem = document.getElementById('imagem-produto');
  const form = document.getElementById('form-produto');

  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));

  if (!usuario) {
    mostrarFeedback('Você precisa estar logado para cadastrar produtos');
    setTimeout(() => {
      window.location.href = '/paginas/login.html';
    }, 2000);
    return;
  }

  inputImagem.addEventListener('change', () => {
    previewImagens(inputImagem, 'preview-fotos');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuarioAtual = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioAtual) {
      mostrarFeedback('Sessão expirada. Faça login novamente.', 'erro');
      return;
    }

    const validacao = validarLimiteProdutos(
      usuarioAtual,
      usuarioAtual.totalProdutos || 0
    );

    if (!validacao.ok) {
      mostrarFeedback(validacao.motivo, 'aviso');
      return;
    }

    if (
      !form.nome.value.trim() ||
      !form.descricao.value.trim() ||
      !form.preco.value ||
      isNaN(parseFloat(form.preco.value)) ||
      parseFloat(form.preco.value) <= 0 ||
      !form.categoria.value
    ) {
      mostrarFeedback(
        'Preencha todos os campos obrigatórios corretamente.',
        'aviso'
      );
      return;
    }

    if (!inputImagem.files.length) {
      mostrarFeedback('Adicione uma imagem para o produto.', 'aviso');
      return;
    }

    const dados = {
      nome: form.nome.value.trim(),
      descricao: form.descricao.value.trim(),
      preco: parseFloat(form.preco.value),
      categoria: form.categoria.value,
      fotosBase64: []
    };

    try {
      const imagem = inputImagem.files[0];
      const base64 = await imageToCompressedBase64(imagem, 800, 0.7);

      console.log(
        'Imagem final:',
        (base64.length / 1024 / 1024).toFixed(2),
        'MB'
      );

      if (base64.length > 4_000_000) {
        mostrarFeedback(
          'Imagem muito grande. Use uma imagem menor.',
          'aviso'
        );
        return;
      }

      dados.fotosBase64.push(base64);

      await cadastrarProduto(dados);

      mostrarFeedback('Produto cadastrado com sucesso!', 'sucesso');
      setTimeout(() => {
        window.location.href = '../paginas/produtos.html';
      }, 2000);

    } catch (err) {
      console.error(err);
      mostrarFeedback(
        err.message || 'Erro ao cadastrar produto',
        'erro'
      );
    }
  });
});