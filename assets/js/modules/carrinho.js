// js/modules/carrinho.js
import { config } from './config.js';
import { mostrarFeedback } from './feedback.js';

// Estado centralizado do carrinho
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

// Inicialização do carrinho
export function setupCarrinho() {
  atualizarCarrinhoUI();
  document.querySelector('.carrinho-icone')?.addEventListener('click', toggleCarrinho);
  document.addEventListener('click', fecharCarrinho);
  document.getElementById('finalizar-compra')?.addEventListener('click', finalizarCompra);
}

// Adicionar produto ao carrinho (versão melhorada)
export function adicionarAoCarrinho(produtoId, event) {
  event?.preventDefault();
  event?.stopPropagation();

  const produto = window.produtosCarregados?.find(p => p.id === produtoId);
  if (!produto) return;

  const itemExistente = carrinho.find(item => item.id === produtoId);

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.foto || config.placeholderImage,
      quantidade: 1
    });
  }

  persistirCarrinho();
  mostrarFeedback(`${produto.nome} adicionado ao carrinho!`);
}

// Funções auxiliares
function persistirCarrinho() {
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarCarrinhoUI();
}

function atualizarCarrinhoUI() {
  updateListaItens();
  updateTotal();
  updateContador();
}

function updateListaItens() {
  const lista = document.getElementById('lista-carrinho');
  if (!lista) return;

  lista.innerHTML = carrinho.map((item, index) => `
    <div class="item-carrinho">
      <img src="${item.imagem}" alt="${item.nome}">
      <div>
        <h4>${item.nome}</h4>
        <p>${item.quantidade}x R$ ${item.preco.toFixed(2)}</p>
        <button class="btn-remover" data-index="${index}">Remover</button>
      </div>
    </div>
  `).join('');

  // Adiciona eventos aos novos botões
  document.querySelectorAll('.btn-remover').forEach(btn => {
    btn.addEventListener('click', (e) => {
      removerDoCarrinho(parseInt(e.target.dataset.index));
    });
  });
}

function updateTotal() {
  const totalElement = document.getElementById('total-carrinho');
  if (totalElement) {
    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    totalElement.textContent = `Total: R$ ${total.toFixed(2)}`;
  }
}

function updateContador() {
  const contador = document.getElementById('contador-carrinho');
  if (contador) {
    const quantidade = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
    contador.textContent = quantidade;
    contador.style.display = quantidade > 0 ? 'block' : 'none';
  }
}

// Funções públicas adicionais
export function removerDoCarrinho(index) {
  if (index >= 0 && index < carrinho.length) {
    carrinho.splice(index, 1);
    persistirCarrinho();
  }
}

export function finalizarCompra() {
  if (carrinho.length === 0) return;
  
  if (confirm('Tem certeza que deseja finalizar a compra?')) {
    carrinho = [];
    persistirCarrinho();
    mostrarFeedback('Compra finalizada com sucesso!');
  }
}

// Funções de UI
function toggleCarrinho(e) {
  e.stopPropagation();
  document.getElementById('carrinho-dropdown').classList.toggle('show');
}

function fecharCarrinho(e) {
  const dropdown = document.getElementById('carrinho-dropdown');
  const clicouNoCarrinho = e.target.closest('.carrinho-dropdown, .carrinho-icone');
  
  if (dropdown && !clicouNoCarrinho) {
    dropdown.classList.remove('show');
  }
}