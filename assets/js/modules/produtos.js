// assets/js/modules/produtos.js

const produtoConfig = {
  apiBaseUrl: '/api/produtos',
  placeholderImage: '../assets/img/placeholder.png'
};

// Função principal para carregar produtos no container indicado
export async function carregarProdutos(containerId, params = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} não encontrado`);
    return;
  }

  try {
    container.innerHTML = criarLoader();

    // Adiciona timestamp para evitar cache da requisição
    params._ = new Date().getTime();
    const queryString = new URLSearchParams(params).toString();
    const url = `${produtoConfig.apiBaseUrl}/listar?${queryString}`;

    console.log('Fetching:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
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
    console.error('Erro ao carregar produtos:', error);
    container.innerHTML = criarMensagemErro(error);
  }
}

export function inicializarProdutos() {
  if (document.getElementById('produtos-destaque')) {
    carregarProdutos('produtos-destaque', { limit: 4 });
  }

  if (document.getElementById('produtos-lista')) {
    carregarProdutos('produtos-lista');
  }
}

export function adicionarAoCarrinho(produtoId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Tenta encontrar o produto na lista geral
  let produto = window.produtosCarregados?.find(p => p.id === produtoId);

  // Se não encontrar na lista, tenta usar o produtoAtual da página detalhes
  if (!produto && window.produtoAtual && window.produtoAtual.id === produtoId) {
    produto = window.produtoAtual;
  }

  if (!produto) {
    console.warn(`Produto com id ${produtoId} não encontrado para adicionar ao carrinho.`);
    return;
  }

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
      quantidade: 1,
      vendedor: {
      nome: produto.vendedor?.nome || 'Vendedor',
      email: produto.vendedor?.email || 'Email não informado',
      telefone: produto.vendedor?.telefone || 'Telefone não informado'
      } 
    });
  }

  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  mostrarFeedback(`${produto.nome} adicionado ao carrinho!`);
}

function renderizarProdutos(produtos) {
  return produtos.map(produto => `
    <div class="produto-card" data-id="${produto.id}">
      <a href="detalhes-produto.html?id=${produto.id}" class="produto-link" tabindex="0" aria-label="Detalhes do produto ${produto.nome}">
        <img src="${produto.foto || produtoConfig.placeholderImage}" 
             alt="${produto.nome}"
             onerror="this.src='${produtoConfig.placeholderImage}'">
      </a>
      <div class="produto-info">
        <h3>${produto.nome}</h3>
        <p class="produto-preco">R$ ${produto.preco.toFixed(2)}</p>
        <button class="produto-btn-comprar" data-id="${produto.id}" aria-label="Comprar ${produto.nome}">
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
      if (window.adicionarAoCarrinho) {
        window.adicionarAoCarrinho(produtoId, e);
      } else {
        console.error('Função adicionarAoCarrinho não está disponível');
      }
    });
  });
}

function criarLoader() {
  return `
    <div class="loader-container" role="status" aria-live="polite">
      <div class="loader-spinner"></div>
      <p class="loader-text">Carregando produtos...</p>
    </div>
  `;
}

function criarMensagemErro(error) {
  return `
    <div class="error-container" role="alert">
      <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
      <h3>Não foi possível carregar os produtos</h3>
      <p class="error-detail">${error.message}</p>
      <div class="error-actions">
        <button class="btn-tentar" onclick="window.location.reload()" aria-label="Tentar novamente">
          <i class="fas fa-sync-alt" aria-hidden="true"></i> Tentar novamente
        </button>
      </div>
    </div>
  `;
}

function criarMensagem(texto, tipo = 'info') {
  return `
    <div class="message-${tipo}" role="alert">
      <i class="fas fa-${tipo === 'info' ? 'info-circle' : 'exclamation-circle'}" aria-hidden="true"></i>
      <p>${texto}</p>
    </div>
  `;
}

export async function editarProduto(produtoId, dados, usuarioLogado) {
  if (!produtoId || !usuarioLogado) {
    throw new Error('ID do produto ou usuário não informado');
  }

  const response = await fetch(`${produtoConfig.apiBaseUrl}/editar?id=${produtoId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-usuario': JSON.stringify(usuarioLogado)
    },
    body: JSON.stringify(dados)
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.error || 'Erro ao editar produto');
  }

  return await response.json();
}

// ✅ NOVA FUNÇÃO: cadastrarProduto
export async function cadastrarProduto(dados) {
  const response = await fetch('/api/produtos/cadastro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });

  if (!response.ok) {
    const erro = await response.json();
    throw new Error(erro.error || 'Erro ao cadastrar produto');
  }

  return await response.json();
}

// Exports globais
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.carregarProdutos = carregarProdutos;
window.inicializarProdutos = inicializarProdutos;
window.editarProduto = editarProduto;
window.cadastrarProduto = cadastrarProduto;
export { renderizarProdutos, configurarEventosProdutos };
