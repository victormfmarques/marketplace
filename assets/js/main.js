// /js/main.js
import { config } from './modules/config.js';
import {inicializarProdutos,renderizarProdutos,configurarEventosProdutos} from './modules/produtos.js';
import { setupCarrinho } from './modules/carrinho.js';
import { mostrarFeedback } from './modules/feedback.js'; // ✅ Novo import

// Torna a função global para uso em outros módulos
window.mostrarFeedback = mostrarFeedback;

window.adicionarAoCarrinho = window.adicionarAoCarrinho || function() {
  console.error('Função não carregada!');
};

document.addEventListener('DOMContentLoaded', () => {
  inicializarProdutos();

  const inputPesquisa = document.getElementById('input-pesquisa');
  if (inputPesquisa) {
    inputPesquisa.addEventListener('input', () => {
      const termo = inputPesquisa.value.trim().toLowerCase();
      const todosProdutos = window.produtosCarregados || [];

      const filtrados = todosProdutos.filter(p =>
        p.nome.toLowerCase().includes(termo) ||
        (p.descricao && p.descricao.toLowerCase().includes(termo))
      );

      const container = document.getElementById('produtos-lista');
      if (container) {
        container.innerHTML = filtrados.length > 0
          ? renderizarProdutos(filtrados)
          : '<p style="text-align:center;">Nenhum produto encontrado.</p>';

        configurarEventosProdutos(); // importante para manter os botões funcionando
      }
    });
  }

  setupCarrinho();
  console.log('Config:', config);
});
