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

    const validacao = validarLimiteProdutos(usuarioAtual,usuarioAtual.totalProdutos || 0);

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

    if (!form['imagem-produto'].files.length) {
    mostrarFeedback(
        'Adicione uma imagem para o produto.',
        'aviso'
    );
    return;
    }

    const dados = {
      usuarioId: usuarioAtual._id,
      nome: form.nome.value.trim(),
      descricao: form.descricao.value.trim(),
      preco: parseFloat(form.preco.value),
      categoria: form.categoria.value,
      fotosBase64: []
    };

    const imagem = inputImagem.files[0];
    if (imagem) {
      try {
        dados.fotosBase64.push(await toBase64(imagem));
      } catch {
        mostrarFeedback('Erro ao processar imagem', 'erro');
        return;
      }
    }

    try {
      await cadastrarProduto(dados);
      mostrarFeedback('Produto cadastrado com sucesso!', 'sucesso');
      setTimeout(() => {
        window.location.href = '../paginas/produtos.html';
      }, 2000);
    } catch (err) {
      mostrarFeedback(err.message || 'Erro ao cadastrar produto', 'erro');
    }
  });
});