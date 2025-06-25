// assets/js/modules/carrinho.js
import { config } from '../config.js';

// Estado global do carrinho
let carrinhoItens = JSON.parse(localStorage.getItem('carrinho')) || [];

// Função para persistir no localStorage e atualizar a UI
function persistirCarrinho() {
  localStorage.setItem('carrinho', JSON.stringify(carrinhoItens));
  atualizarUI();
}

// Atualiza toda a interface do carrinho
function atualizarUI() {
  atualizarLista();
  atualizarTotal();
  atualizarContador();
}

// Funções exportadas
export function setupCarrinho() {
  carregarCarrinho();
  document.querySelector('.carrinho-icone')?.addEventListener('click', toggleCarrinho);
  document.addEventListener('click', fecharCarrinho);
  document.getElementById('finalizar-compra')?.addEventListener('click', finalizarCompra);
}

export function adicionarAoCarrinho(produtoId, event) {
  event?.preventDefault();
  event?.stopPropagation();

  const produto = window.produtosCarregados?.find(p => p.id === produtoId);
  if (!produto) return;

  const itemExistente = carrinhoItens.find(item => item.id === produtoId);

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinhoItens.push({
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

export function removerDoCarrinho(index) {
  carrinhoItens.splice(index, 1);
  persistirCarrinho();
}

export function finalizarCompra() {
  if (confirm('Tem certeza que deseja finalizar a compra?')) {
    carrinhoItens = [];
    persistirCarrinho();
    mostrarFeedback('Compra finalizada com sucesso!');
  }
}

// Funções auxiliares
function carregarCarrinho() {
  const dados = localStorage.getItem('carrinho');
  carrinhoItens = dados ? JSON.parse(dados) : [];
  atualizarUI();
}

function atualizarLista() {
  const lista = document.getElementById('lista-carrinho');
  if (!lista) return;

  lista.innerHTML = carrinhoItens.map((item, index) => `
    <div class="item-carrinho">
      <img src="${item.imagem}" alt="${item.nome}">
      <div>
        <h4>${item.nome} (${item.quantidade}x)</h4>
        <p>R$ ${item.preco.toFixed(2)}</p>
        <button class="btn-remover" data-index="${index}">Remover</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.btn-remover').forEach(btn => {
    btn.addEventListener('click', (e) => {
      removerDoCarrinho(parseInt(e.target.dataset.index));
    });
  });
}

function atualizarTotal() {
  const totalElement = document.getElementById('total-carrinho');
  if (totalElement) {
    const total = carrinhoItens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    totalElement.textContent = `Total: R$ ${total.toFixed(2)}`;
  }
}

function atualizarContador() {
  const contador = document.getElementById('contador-carrinho');
  if (contador) {
    const quantidadeTotal = carrinhoItens.reduce((sum, item) => sum + item.quantidade, 0);
    contador.textContent = quantidadeTotal;
    contador.style.visibility = quantidadeTotal > 0 ? 'visible' : 'hidden';
  }
}

// Funções de UI
export function mostrarFeedback(mensagem) {
  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.textContent = mensagem;
    feedback.classList.add('show');
    setTimeout(() => feedback.classList.remove('show'), 3000);
  }
}

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