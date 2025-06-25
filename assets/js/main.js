import { inicializarProdutos } from './modules/produtos.js';
import { 
  setupCarrinho, 
  adicionarAoCarrinho, 
  removerDoCarrinho,
  finalizarCompra,
  mostrarFeedback
} from './modules/carrinho.js';

// Disponibiliza funções globais (apenas se necessário para HTML)
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.mostrarFeedback = mostrarFeedback;

document.addEventListener('DOMContentLoaded', () => {
  inicializarProdutos();
  setupCarrinho();
});