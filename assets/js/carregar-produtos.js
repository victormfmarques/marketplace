/**
 * CARREGAMENTO DE PRODUTOS PARA TODAS AS PÁGINAS
 * 
 * Funcionalidades:
 * - Carrega produtos para a home (destaques e novidades)
 * - Carrega lista completa de produtos na página de produtos
 * - Gerencia a renderização consistente em todo o site
 */

// Configurações globais
const config = {
  apiBaseUrl: '/api/produtos/listar',
  placeholderImage: '../assets/img/placeholder.png'
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  // Verifica em qual página estamos para decidir o que carregar
  if (document.getElementById('produtos-destaque')) {
    await carregarProdutosHome();
  }
  
  if (document.getElementById('lista-produtos')) {
    await carregarTodosProdutos();
  }
});

// Função para a Home Page
async function carregarProdutosHome() {
  try {
    const [destaques, novidades] = await Promise.all([
      carregarDadosAPI('?destaque=true&limit=4'),
      carregarDadosAPI('?novidades=true&limit=8')
    ]);

    renderizarProdutos(destaques, 'produtos-destaque');
    renderizarProdutos(novidades, 'produtos-novidades');
  } catch (error) {
    console.error('Erro na home:', error);
    mostrarErro('produtos-destaque');
    mostrarErro('produtos-novidades');
  }
}

// Função para a Página de Produtos
async function carregarTodosProdutos() {
  try {
    const produtos = await carregarDadosAPI();
    renderizarProdutos(produtos, 'lista-produtos');
  } catch (error) {
    console.error('Erro na página de produtos:', error);
    mostrarErro('lista-produtos');
  }
}

// Funções utilitárias
async function carregarDadosAPI(query = '') {
  const response = await fetch(`${config.apiBaseUrl}${query}`);
  if (!response.ok) throw new Error('Falha na API');
  const { produtos } = await response.json();
  return produtos || [];
}

function renderizarProdutos(produtos, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!produtos?.length) {
    container.innerHTML = '<p class="sem-produtos">Nenhum produto encontrado</p>';
    return;
  }

  container.innerHTML = produtos.map(produto => `
    <article class="${containerId === 'lista-produtos' ? 'col-4' : 'produto-card'}" data-id="${produto._id}">
      <a href="/paginas/detalhes-produto.html?id=${produto._id}">
        <img src="${produto.fotos[0] || config.placeholderImage}" 
             alt="${produto.nome}"
             onerror="this.src='${config.placeholderImage}'">
      </a>
      <h4>${produto.nome}</h4>
      <div class="classificacao" aria-label="${produto.avaliacao || 5} estrelas">
        ${gerarEstrelas(produto.avaliacao || 5)}
      </div>
      <p>R$ ${produto.preco.toFixed(2)}</p>
      <button onclick="adicionarAoCarrinho(event, '${produto._id}')">Comprar</button>
      
      ${containerId === 'lista-produtos' && usuarioEhDono(produto) ? `
        <div class="acoes-produto">
          <button onclick="editarProduto('${produto._id}')">Editar</button>
        </div>
      ` : ''}
    </article>
  `).join('');
}

function mostrarErro(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="error">
        <p>Falha ao carregar produtos</p>
        <button onclick="window.location.reload()">Tentar novamente</button>
      </div>
    `;
  }
}

function usuarioEhDono(produto) {
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
  return usuario && usuario._id === produto.usuarioId;
}

function gerarEstrelas(quantidade) {
  return [...Array(5)].map((_, i) => 
    `<ion-icon name="${i < quantidade ? 'star' : 'star-outline'}"></ion-icon>`
  ).join('');
}

// Funções globais (acessíveis pelo HTML)
window.adicionarAoCarrinho = function(event, produtoId) {
  event.preventDefault();
  event.stopPropagation();
  // Implemente sua lógica de carrinho aqui
  console.log('Adicionado ao carrinho:', produtoId);
};

window.editarProduto = function(produtoId) {
  window.location.href = `/paginas/editar-produto.html?id=${produtoId}`;
};