// assets/js/pages/produtos.js

// =========================== IMPORTAÇÕES ===============================
import { setProdutos, encontrarProdutoPorId } from '../modules/store.js';
import { adicionarAoCarrinho } from '../modules/carrinho.js';
import { produtosAPI } from '../modules/api.js';
import { criarMensagemErro } from '../modules/ui.js';
// =======================================================================

if (!window.mostrarErro) {
  window.addEventListener('load', () => {
    console.warn('Funções globais ainda não estavam prontas, recarregando...');
  });
}

const produtoConfig = {
  apiBaseUrl: '/api?rota=produtos',
  placeholderImage: '../assets/img/placeholder.png'
};

// -------------------- FUNÇÕES AUXILIARES --------------------

function renderizarProdutos(produtos, basePath = '') {
  return produtos.map(produto => `
    <div class="produto-card" data-id="${produto.id || produto._id}">
      <a href="${basePath}detalhes-produto.html?id=${produto.id || produto._id}" class="produto-link" tabindex="0" aria-label="Detalhes do produto ${produto.nome}">
        <img src="${produto.foto || produto.fotos?.[0] || produtoConfig.placeholderImage}" 
             alt="${produto.nome}"
             onerror="this.src='${produtoConfig.placeholderImage}'">
      </a>
      <div class="produto-info">
        <h3>${produto.nome}</h3>
        <p class="produto-preco">R$ ${(produto.preco || 0).toFixed(2).replace('.', ',')}</p>
        <button class="produto-btn-comprar" data-id="${produto.id || produto._id}" aria-label="Comprar ${produto.nome}">
          Comprar
        </button>
      </div>
    </div>
  `).join('');
}

function configurarEventosProdutos() {
  document.querySelectorAll('.produto-btn-comprar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const produtoId = e.target.dataset.id;
      
      // Encontra o objeto do produto na lista de produtos carregados
      const produtoParaAdicionar = encontrarProdutoPorId(produtoId);

      if (produtoParaAdicionar) {
        // Passa o objeto completo para a função
        adicionarAoCarrinho(produtoParaAdicionar, e); 
      } else {
        console.error(`Produto com ID ${produtoId} não encontrado no store.`);
      }
    });
  });
}

// -------------------- FUNÇÕES PRINCIPAIS --------------------

export async function carregarProdutos(containerId, params = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Detecta de qual página estamos vindo
  const isHomePage = window.location.pathname === '/index.html' || window.location.pathname === '/';
  const basePath = isHomePage ? 'paginas/' : '';

  try {
    container.innerHTML = criarLoader("Carregando produtos...");

    const queryString = new URLSearchParams(params).toString();
    const result = await produtosAPI.listar(queryString);

    if (!result.data || result.data.length === 0) {
      container.innerHTML = criarMensagemErro(
                'Nenhum Produto Encontrado', // Título da mensagem
                'info', // Tipo 'info' para usar o ícone de informação
                null,   // Sem botão de "tentar novamente"
                ''      // Sem texto no botão
            );
      return;
    }

    setProdutos(result.data);
    // PASSA O basePath PARA A FUNÇÃO DE RENDERIZAÇÃO
    container.innerHTML = renderizarProdutos(result.data, basePath); 
    configurarEventosProdutos();

  } catch (error) {
    console.error('Erro ao carregar produtos:', error);

    window.mostrarErro(container,
      'Não foi possível carregar os produtos',
      navigator.onLine
        ? 'Ocorreu um erro interno no servidor. Tente novamente em alguns instantes.'
        : 'Parece que você está sem conexão com a internet.',
      () => carregarProdutos(containerId, params)
    );
  }
}

export function inicializarProdutos() {
  if (document.getElementById('produtos-destaque')) {
    const larguraTela = window.innerWidth;
    let limite = 8;

    if (larguraTela < 480) limite = 2;
    else if (larguraTela < 768) limite = 4;
    else if (larguraTela < 1154) limite = 6;

    carregarProdutos('produtos-destaque', { limit: limite });
  }

  if (document.getElementById('produtos-lista')) {
    carregarProdutos('produtos-lista');
  }
}

// -------------------- EXPORTS GLOBAIS --------------------
window.carregarProdutos = carregarProdutos;
window.inicializarProdutos = inicializarProdutos;

export { renderizarProdutos, configurarEventosProdutos };

window.addEventListener('resize', () => {
  clearTimeout(window.__resizeTimer);
  window.__resizeTimer = setTimeout(() => {
    if (document.getElementById('produtos-destaque')) inicializarProdutos();
  }, 300);
});