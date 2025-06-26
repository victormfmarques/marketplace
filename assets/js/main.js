// /js/main.js
import { config } from './modules/config.js';
import { inicializarProdutos } from './modules/produtos.js';
import { setupCarrinho } from './modules/carrinho.js';
import { mostrarFeedback } from './modules/feedback.js'; // ✅ Novo import

// Torna a função global para uso em outros módulos
window.mostrarFeedback = mostrarFeedback;

window.adicionarAoCarrinho = window.adicionarAoCarrinho || function() {
  console.error('Função não carregada!');
};

document.addEventListener('DOMContentLoaded', () => {
  inicializarProdutos();
  setupCarrinho();
  console.log('Config:', config);
});
