// js/modules/carrinho.js
import { config } from './config.js';
import { mostrarFeedback } from './ui.js';

// Estado do carrinho
let carrinho = [];

// -------------------- INICIALIZAÇÃO --------------------
export function setupCarrinho() {
  carregarCarrinhoDoStorage();
  atualizarCarrinhoUI();
  validarCarrinhoAntesDeContinuar();
  setupEventosPreviewCarrinho();

  const iconeCarrinho = document.getElementById('icone-carrinho');
  const dropdown = document.getElementById('carrinho-dropdown');

  iconeCarrinho?.addEventListener('click', toggleCarrinho);

  document.addEventListener('click', (e) => {
    if (dropdown && !iconeCarrinho?.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  document.getElementById('limpar-carrinho')?.addEventListener('click', limparCarrinho);

  if (carrinho.length === 0) dropdown?.classList.remove('show');
}

// -------------------- ADICIONAR AO CARRINHO --------------------
export function adicionarAoCarrinho(produto, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
  if (!usuario) {
    mostrarFeedback('Você precisa fazer login para continuar.', 'aviso');
    setTimeout(() => {
      window.location.href = `/paginas/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }, 4000);
    return false;
  }

  if (!produto) {
    console.warn('Produto inválido.');
    return;
  }

  const itemExistente = carrinho.find(item => (item.id || item._id) === (produto.id || produto._id));

  if (itemExistente) itemExistente.quantidade += 1;
  else {
    carrinho.push({
      id: produto.id || produto._id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: resolverImagemProduto(produto),
      quantidade: 1,
      vendedor: {
        id: produto.vendedor?.id || produto.usuarioId || 'Desconhecido',
        nome: produto.vendedor?.nome || 'Vendedor',
        email: produto.vendedor?.email || 'Email não informado',
        telefone: produto.vendedor?.telefone || 'Telefone não informado'
      }
    });
  }

  persistirCarrinho();
  mostrarFeedback(`${produto.nome} adicionado ao carrinho!`, 'sucesso');
  return true;
}

// -------------------- FUNÇÕES AUXILIARES --------------------
function carregarCarrinhoDoStorage() {
  const carrinhoSalvo = JSON.parse(localStorage.getItem(getChaveCarrinho())) || [];
  carrinho = carrinhoSalvo.filter(item => item && typeof item === 'object' && item.id && typeof item.preco === 'number');
}

function persistirCarrinho() {
  localStorage.setItem(getChaveCarrinho(), JSON.stringify(carrinho));
  atualizarCarrinhoUI();
  atualizarPreviewSeAberto();
}

function resolverImagemProduto(produto) {
  if (!produto) return config.placeholderImage;
  if (typeof produto.foto === 'string') return produto.foto;
  if (produto.foto?.url) return produto.foto.url;
  if (Array.isArray(produto.fotos) && produto.fotos.length > 0) {
    const primeira = produto.fotos[0];
    if (typeof primeira === 'string') return primeira;
    if (primeira?.url) return primeira.url;
  }
  return config.placeholderImage;
}

function getChaveCarrinho() {
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
  return usuario?.email ? `carrinho_${usuario.email}` : 'carrinho_anonimo';
}

// -------------------- ATUALIZAÇÃO DA UI --------------------
function atualizarCarrinhoUI() {
  updateListaItens();
  updateTotal();
  updateContador();
  updateResumo();
}

// Lista completa de itens (carrinho.html)
function updateListaItens() {
  const lista = document.getElementById('lista-carrinho');
  if (!lista) return;

  lista.innerHTML = carrinho.map(item => `
    <div class="item-carrinho">
      <img src="${item.imagem}" alt="${item.nome}" class="img-detalhes" data-id="${item.id}">
      <div class="item-info">
        <h3 class="link-detalhes" data-id="${item.id}">${item.nome}</h3>
        <p>Preço unitário: R$ ${item.preco.toFixed(2).replace('.', ',')}</p>
        <p>Subtotal: R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</p>
        <div class="controle-quantidade">
          <button class="btn-menos" data-id="${item.id}">−</button>
          <span class="quantidade">${item.quantidade}</span>
          <button class="btn-mais" data-id="${item.id}">+</button>
        </div>
      </div>
      <div class="item-acoes">
        <button class="btn-remover" data-id="${item.id}">Remover</button>
      </div>
    </div>
  `).join('');

  // Eventos dos botões da lista
  lista.querySelectorAll('.btn-mais').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = carrinho.find(p => p.id === id);
      if (item) {
        item.quantidade++;
        persistirCarrinho();
        mostrarFeedback(`1 unidade de ${item.nome} adicionada.`, 'sucesso');
      }
    });
  });

  lista.querySelectorAll('.btn-menos').forEach(btn => {
    btn.addEventListener('click', () => removerUmaUnidade(btn.dataset.id));
  });

  lista.querySelectorAll('.btn-remover').forEach(btn => {
    btn.addEventListener('click', () => {
      carrinho = carrinho.filter(item => item.id !== btn.dataset.id);
      persistirCarrinho();
      mostrarFeedback('Produto removido do carrinho.', 'aviso');
    });
  });

  // Clique na imagem ou nome
  lista.querySelectorAll('.img-detalhes, .link-detalhes').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      window.location.href = `/paginas/detalhes-produto.html?id=${id}`;
    });
  });
}

function updateTotal() {
  const totalElement = document.getElementById('total-carrinho');
  if (totalElement) {
    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    totalElement.textContent = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
  }
}

function updateContador() {
  const contador = document.getElementById('contador-carrinho');
  if (!contador) return;
  const quantidade = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
  contador.textContent = quantidade;
  contador.style.display = quantidade > 0 ? 'block' : 'none';
}

function updateResumo() {
  const resumo = document.getElementById('resumo-itens');
  if (!resumo) return;
  const quantidade = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
  resumo.textContent = quantidade;
}

// -------------------- PREVIEW DO DROPDOWN --------------------
function renderizarPreviewCarrinho() {
  const container = document.getElementById('preview-carrinho');
  if (!container) return;
  container.innerHTML = '';

  if (carrinho.length === 0) {
    container.innerHTML = '<p style="font-size:0.85rem;">Carrinho vazio</p>';
    return;
  }

  const ultimosItens = carrinho.slice(-3).reverse();

  container.innerHTML = ultimosItens.map(item => `
    <div class="item-carrinho preview">
      <img src="${item.imagem}" alt="${item.nome}" class="img-detalhes" data-id="${item.id}" onerror="this.src='${config.placeholderImage}'">
      <div class="info">
        <strong class="link-detalhes" data-id="${item.id}">${item.nome}</strong>
        <span>${item.quantidade}x</span>
        <span class="preco">R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
        <span class="subtotal">Subtotal: R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
        <div class="acoes-mini">
          <button class="btn-mini menos" data-id="${item.id}">−</button>
          <button class="btn-mini mais" data-id="${item.id}">+</button>
          <button class="btn-mini remover" data-id="${item.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function setupEventosPreviewCarrinho() {
  const container = document.getElementById('preview-carrinho');
  if (!container) return;

  container.addEventListener('click', (e) => {
    e.stopPropagation();

    const btn = e.target.closest('.btn-mini');
    const targetProduto = e.target.closest('.img-detalhes, .link-detalhes');

    if (btn) {
      const id = btn.dataset.id;
      const item = carrinho.find(p => p.id === id);

      if (btn.classList.contains('mais') && item) {
        item.quantidade++;
        persistirCarrinho();
        mostrarFeedback(`1 unidade de ${item.nome} adicionada.`, 'sucesso');
      }

      if (btn.classList.contains('menos') && item) removerUmaUnidade(id);

      if (btn.classList.contains('remover')) {
        carrinho = carrinho.filter(p => p.id !== id);
        persistirCarrinho();
        mostrarFeedback('Produto removido do carrinho.', 'aviso');
        fecharDropdownSeVazio();
      }
    }

    if (targetProduto) {
      const idProduto = targetProduto.dataset.id;
      if (idProduto) window.location.href = `/paginas/detalhes-produto.html?id=${idProduto}`;
    }
  });
}

function atualizarPreviewSeAberto() {
  const dropdown = document.getElementById('carrinho-dropdown');
  if (dropdown?.classList.contains('show')) renderizarPreviewCarrinho();
}

// -------------------- OUTRAS FUNÇÕES --------------------
export function removerUmaUnidade(produtoId) {
  const index = carrinho.findIndex(item => item.id === produtoId);
  if (index === -1) return;

  const item = carrinho[index];

  if (item.quantidade > 1) {
    item.quantidade--;
    mostrarFeedback(`1 unidade de ${item.nome} removida do carrinho.`, 'aviso');
  } else {
    carrinho.splice(index, 1);
    mostrarFeedback(`${item.nome} removido do carrinho.`, 'aviso');
  }

  persistirCarrinho();
  fecharDropdownSeVazio();
}

export function limparCarrinho() {
  carrinho = [];
  persistirCarrinho();
  mostrarFeedback('Carrinho limpo com sucesso!');
}

function toggleCarrinho(e) {
  e.stopPropagation();

  if (window.innerWidth <= 768) {
    window.location.href = '/paginas/carrinho.html';
    return;
  }

  const dropdown = document.getElementById('carrinho-dropdown');
  dropdown?.classList.toggle('show');
  if (dropdown?.classList.contains('show')) renderizarPreviewCarrinho();
}

function fecharDropdownSeVazio() {
  const dropdown = document.getElementById('carrinho-dropdown');
  if (dropdown && carrinho.length === 0) dropdown.classList.remove('show');
}

function validarCarrinhoAntesDeContinuar() {
  const btnContinuar = document.querySelector('.btn-finalizar');
  if (!btnContinuar) return;

  btnContinuar.addEventListener('click', (e) => {
    if (carrinho.length === 0) {
      e.preventDefault();
      mostrarFeedback('Seu carrinho está vazio.', 'aviso');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 3000);
    }
  });
}
