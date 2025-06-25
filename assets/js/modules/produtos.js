// assets/js/modules/produtos.js
const produtoConfig = {
  apiBaseUrl: '/api/produtos',
  placeholderImage: '../assets/img/placeholder.png'
};

// Função principal para carregar produtos
export async function carregarProdutos(containerId, params = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} não encontrado`);
    return;
  }

  try {
    container.innerHTML = criarLoader();
    
    params._ = new Date().getTime(); // Cache buster
    const queryString = new URLSearchParams(params).toString();
    const url = `${produtoConfig.apiBaseUrl}/listar?${queryString}`;
    
    console.log('Fetching:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('API Response:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'Erro na resposta da API');
    }

    if (!result.data || result.data.length === 0) {
      container.innerHTML = criarMensagem('Nenhum produto disponível', 'info');
      return;
    }

    window.produtosCarregados = result.data;
    container.innerHTML = renderizarProdutos(result.data);
    configurarEventosProdutos();

  } catch (error) {
    console.error('Erro completo:', error);
    container.innerHTML = criarMensagemErro(error);
  }
}

// Função para inicialização automática
export function inicializarProdutos() {
  if (document.getElementById('produtos-destaque')) {
    carregarProdutos('produtos-destaque', { limit: 4 });
  }
  
  if (document.getElementById('produtos-lista')) {
    carregarProdutos('produtos-lista');
  }
}

// Função para adicionar ao carrinho (usada nos eventos)
export function adicionarAoCarrinho(produtoId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const produto = window.produtosCarregados?.find(p => p.id === produtoId);
  if (!produto) return;

  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  const itemExistente = carrinho.find(item => item.id === produtoId);

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.foto || produtoConfig.placeholderImage,
      quantidade: 1
    });
  }

  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  mostrarFeedback(`${produto.nome} adicionado ao carrinho!`);
}

// Funções auxiliares
function renderizarProdutos(produtos) {
  return produtos.map(produto => `
    <div class="produto-card" data-id="${produto.id}">
      <a href="detalhes-produto.html?id=${produto.id}" class="produto-link">
        <img src="${produto.foto || produtoConfig.placeholderImage}" 
             alt="${produto.nome}"
             onerror="this.src='${produtoConfig.placeholderImage}'">
      </a>
      <div class="produto-info">
        <h3>${produto.nome}</h3>
        <p class="produto-preco">R$ ${produto.preco.toFixed(2)}</p>
        <button class="produto-btn-comprar" data-id="${produto.id}">
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
      adicionarAoCarrinho(produtoId, e);
    });
  });
}

function criarLoader() {
  return `
    <div class="loader-container">
      <div class="loader-spinner"></div>
      <p class="loader-text">Carregando produtos...</p>
    </div>
  `;
}

function criarMensagemErro(error) {
  return `
    <div class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Não foi possível carregar os produtos</h3>
      <p class="error-detail">${error.message}</p>
      <div class="error-actions">
        <button class="btn-tentar" onclick="window.location.reload()">
          <i class="fas fa-sync-alt"></i> Tentar novamente
        </button>
      </div>
    </div>
  `;
}

function criarMensagem(texto, tipo = 'info') {
  return `
    <div class="message-${tipo}">
      <i class="fas fa-${tipo === 'info' ? 'info-circle' : 'exclamation-circle'}"></i>
      <p>${texto}</p>
    </div>
  `;
}

// Exporta funções que precisam ser acessíveis globalmente (para HTML)
window.adicionarAoCarrinho = adicionarAoCarrinho;