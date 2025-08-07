// js/modules/carrinho.js
import { config } from './config.js';
import { mostrarFeedback } from './feedback.js';

// Estado centralizado do carrinho
let carrinho = JSON.parse(localStorage.getItem(getChaveCarrinho())) || [];

// Inicialização do carrinho
export function setupCarrinho() {
  atualizarCarrinhoUI();

  document.querySelector('.carrinho-icone')?.addEventListener('click', toggleCarrinho);
  document.addEventListener('click', fecharCarrinho);
  document.getElementById('finalizar-compra').addEventListener('click', () => {
  window.location.href = '../paginas/finalizar-compra.html';});
  document.querySelector('.btn-limpar')?.addEventListener('click', limparCarrinho);
}

// Adicionar produto ao carrinho
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
      quantidade: 1,
      vendedor: {
        nome: produto.vendedor?.nome || 'Vendedor',
        email: produto.vendedor?.email || 'Email não informado',
        telefone: produto.vendedor?.telefone || 'Telefone não informado'
      }
    });
  }

  persistirCarrinho();
  mostrarFeedback(`${produto.nome} adicionado ao carrinho!`);
}

// Funções auxiliares
function persistirCarrinho() {
  localStorage.setItem(getChaveCarrinho(), JSON.stringify(carrinho));
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

  lista.innerHTML = carrinho.map((item) => `
    <div class="item-carrinho">
      <img src="${item.imagem}" alt="${item.nome}" class="img-detalhes" data-id="${item.id}">
      <div>
        <h4 class="link-detalhes" data-id="${item.id}">${item.nome}</h4>
        <p>${item.quantidade}x R$ ${item.preco.toFixed(2)}</p>
        <button class="btn-remover" title="Remover produto" data-id="${item.id}">Remover</button>
      </div>
    </div>
  `).join('');

  // Evento de remover uma unidade
  document.querySelectorAll('.btn-remover').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      removerUmaUnidade(id);
    });
  });

  // ✅ Evento de redirecionar pelo nome
  document.querySelectorAll('.link-detalhes').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      if (id) {
        window.location.href = `../paginas/detalhes-produto.html?id=${id}`;
      }
    });
  });

  // ✅ Evento de redirecionar pela imagem
  document.querySelectorAll('.img-detalhes').forEach(img => {
    img.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      if (id) {
        window.location.href = `../paginas/detalhes-produto.html?id=${id}`;
      }
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

// Remover 1 unidade de um produto
export function removerUmaUnidade(produtoId) {
  const index = carrinho.findIndex(item => item.id === produtoId);
  if (index !== -1) {
    const produto = carrinho[index];

    if (produto.quantidade > 1) {
      produto.quantidade -= 1;
      mostrarFeedback(`1 unidade de ${produto.nome} removida do carrinho.`);
    } else {
      carrinho.splice(index, 1);
      mostrarFeedback(`${produto.nome} removido do carrinho.`, 'aviso');
    }

    persistirCarrinho();
  }
}

// Limpar carrinho inteiro
export function limparCarrinho() {
  carrinho = [];
  persistirCarrinho();
  mostrarFeedback('Carrinho limpo com sucesso!');
}

// Funções de UI
function toggleCarrinho(e) {
  e.stopPropagation();
  document.getElementById('carrinho-dropdown')?.classList.toggle('show');
}

function fecharCarrinho(e) {
  const dropdown = document.getElementById('carrinho-dropdown');
  const clicouNoCarrinho = e.target.closest('.carrinho-dropdown, .carrinho-icone');
  if (dropdown && !clicouNoCarrinho) {
    dropdown.classList.remove('show');
  }
}

function getChaveCarrinho() {
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
  if (usuario && usuario.email) {
    return `carrinho_${usuario.email}`;
  }
  return 'carrinho_anonimo';
}


// Expondo para uso global se necessário
window.adicionarAoCarrinho = adicionarAoCarrinho;
