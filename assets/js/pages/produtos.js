// assets/js/pages/produtos.js

// =========================== IMPORTAÇÕES ===============================
import { setProdutos, encontrarProdutoPorId } from '../modules/store.js';
import { adicionarAoCarrinho } from '../modules/carrinho.js';
import { produtosAPI } from '../modules/api.js';
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
    container.innerHTML = window.criarLoader("Carregando produtos...");

    const queryString = new URLSearchParams(params).toString();
    const result = await produtosAPI.listar(queryString);

    if (!result.data || result.data.length === 0) {
      container.innerHTML = window.criarMensagem('Nenhum produto disponível', 'info');
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

// -------------------- PRODUTOS DO USUÁRIO --------------------

const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

if (usuarioLogado) {
  async function carregarProdutosUsuario() {
    const container = document.getElementById('produtos-usuario');
    if (!container) return;

    try {
      container.innerHTML = window.criarLoader("Carregando seus produtos...");

      const result = await produtosAPI.listarPorUsuario(usuarioLogado._id);

      if (result.data.length === 0) {
        container.innerHTML = window.criarMensagem('Você ainda não postou produtos.', 'info');
        return;
      }

      container.innerHTML = result.data.map(prod => {
        const foto = prod.fotos?.length
          ? (prod.fotos[0].startsWith('http') ? prod.fotos[0] : `https://res.cloudinary.com/ddfacpcm5/image/upload/${prod.fotos[0]}`)
          : '/assets/img/placeholder.png';

        return `
          <div class="produto-card">
            <a href="detalhes-produto.html?id=${prod._id}">
              <img src="${foto}" alt="${prod.nome}" />
            </a>
            <div class="produto-info">
              <h4>${prod.nome}</h4>
              <p>R$ ${parseFloat(prod.preco).toFixed(2).replace('.', ',')}</p>
              <button class="btn-editar" onclick="window.location.href='editar-produto.html?id=${prod._id}'">Editar</button>
            </div>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error('Erro ao carregar produtos do usuário:', error);

      window.mostrarErro(container,
        'Não foi possível carregar seus produtos',
        navigator.onLine
          ? 'Ocorreu um erro interno no servidor. Tente novamente em alguns instantes.'
          : 'Parece que você está sem conexão com a internet.',
        carregarProdutosUsuario,
        'tentar-novamente-usuario'
      );
    }
  }

  document.addEventListener('DOMContentLoaded', carregarProdutosUsuario);
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