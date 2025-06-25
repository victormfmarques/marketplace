// /js/main.js
import { config } from './modules/config.js'; // Caminho relativo corrigido
import { inicializarProdutos } from './modules/produtos.js';
import { setupCarrinho } from './modules/carrinho.js';

// Funções globais (se necessário)
window.adicionarAoCarrinho = window.adicionarAoCarrinho || function() {
  console.error('Função não carregada!');
};

document.addEventListener('DOMContentLoaded', () => {
  inicializarProdutos();
  setupCarrinho();
  console.log('Config:', config); // Verifique se carregou
});