// =============================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// =============================================
const MenuItens = document.getElementById("MenuItens");
const carrinhoDropdown = document.getElementById('carrinho-dropdown');
let ultimoClick = 0;
let produtosCarregados = [];

const config = {
  apiBaseUrl: '/api/produtos/listar',
  placeholderImage: '../assets/img/placeholder.png'
};

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  setupMenuMobile();
  setupCarrinho();
  verificarUsuarioLogado();
  carregarProdutos();
});

// =============================================
// MENU MOBILE
// =============================================
function setupMenuMobile() {
  MenuItens.style.maxHeight = "0px";
  document.querySelector('.menu-celular')?.addEventListener('click', menucelular);
}

function menucelular() {
  MenuItens.style.maxHeight = MenuItens.style.maxHeight === "0px" ? "200px" : "0px";
}

// =============================================
// CARRINHO DE COMPRAS
// =============================================
function setupCarrinho() {
  document.querySelector('.carrinho-icone')?.addEventListener('click', toggleCarrinho);
  document.addEventListener('click', fecharCarrinho);
  document.getElementById('finalizar-compra')?.addEventListener('click', finalizarCompra);
  atualizarCarrinho();
}

function toggleCarrinho(e) {
  e.stopPropagation();
  carrinhoDropdown.classList.toggle('show');
}

function fecharCarrinho() {
  carrinhoDropdown.classList.remove('show');
}

function atualizarCarrinho() {
  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  const listaCarrinho = document.getElementById('lista-carrinho');
  const totalCarrinho = document.getElementById('total-carrinho');
  const contador = document.getElementById('contador-carrinho');
  const botoesCarrinho = document.querySelector('.carrinho-botoes');

  contador.textContent = carrinho.reduce((total, item) => total + (item.quantidade || 1), 0);

  listaCarrinho.innerHTML = '';
  let total = 0;

  carrinho.forEach((item, index) => {
    total += item.preco * (item.quantidade || 1);

    const itemElement = document.createElement('div');
    itemElement.className = 'item-carrinho';
    itemElement.innerHTML = `
      <img src="${item.imagem}" alt="${item.nome}" onerror="this.src='${config.placeholderImage}'">
      <div class="item-info">
        <h4>${item.nome} ${item.quantidade > 1 ? `(${item.quantidade}x)` : ''}</h4>
        <p><strong>Preço:</strong> R$ ${item.preco.toFixed(2)}</p>
        <p><strong>Subtotal:</strong> R$ ${(item.preco * (item.quantidade || 1)).toFixed(2)}</p>
      </div>
      <button class="remover-item" onclick="removerDoCarrinho(${index}, event)">×</button>
    `;
    listaCarrinho.appendChild(itemElement);
  });

  if (totalCarrinho) totalCarrinho.textContent = `Total: R$ ${total.toFixed(2)}`;
  if (botoesCarrinho) botoesCarrinho.style.display = carrinho.length > 0 ? 'flex' : 'none';
}

function adicionarAoCarrinho(produtoId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const agora = Date.now();
  if (agora - ultimoClick < 500) return;
  ultimoClick = agora;

  const produto = produtosCarregados.find(p => p._id === produtoId);
  if (!produto) return;

  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  const itemExistente = carrinho.find(item => item._id === produtoId);

  if (itemExistente) {
    itemExistente.quantidade = (itemExistente.quantidade || 1) + 1;
  } else {
    carrinho.push({
      _id: produto._id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.fotos[0] || config.placeholderImage,
      quantidade: 1
    });
  }

  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarCarrinho();
  mostrarFeedback(`${produto.nome} adicionado ao carrinho!`, 'sucesso');
}

function removerDoCarrinho(index, event) {
  if (event) event.stopPropagation();

  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  carrinho.splice(index, 1);
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarCarrinho();
  mostrarFeedback('Item removido do carrinho', 'aviso');
}

function limparCarrinho() {
  if (confirm('Tem certeza que deseja remover todos os itens do carrinho?')) {
    localStorage.removeItem('carrinho');
    atualizarCarrinho();
    mostrarFeedback('Carrinho limpo com sucesso! 🌿', 'sucesso');
  }
}

function finalizarCompra(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  if (carrinho.length === 0) {
    mostrarFeedback('Seu carrinho está vazio! 🛒', 'info');
    return;
  }

  localStorage.removeItem('carrinho');
  atualizarCarrinho();
  mostrarFeedback('Compra finalizada com sucesso! ✅', 'sucesso');
}

// =============================================
// CARREGAMENTO E RENDERIZAÇÃO DE PRODUTOS
// =============================================
async function carregarProdutos() {
  try {
    if (document.getElementById('produtos-destaque')) {
      const [destaques, novidades] = await Promise.all([
        carregarDadosAPI('?destaque=true&limit=4'),
        carregarDadosAPI('?novidades=true&limit=8')
      ]);

      renderizarProdutos(destaques, 'produtos-destaque');
      renderizarProdutos(novidades, 'produtos-novidades');
    }

    if (document.getElementById('lista-produtos')) {
      const produtos = await carregarDadosAPI();
      renderizarProdutos(produtos, 'lista-produtos');
    }
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    mostrarErro('produtos-destaque');
    mostrarErro('produtos-novidades');
    mostrarErro('lista-produtos');
  }
}

async function carregarDadosAPI(query = '') {
  const response = await fetch(`${config.apiBaseUrl}${query}`);
  if (!response.ok) throw new Error('Falha na API');
  const { produtos } = await response.json();
  produtosCarregados = [...produtosCarregados, ...produtos];
  return produtos;
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
      <button onclick="adicionarAoCarrinho('${produto._id}', event)">Comprar</button>

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

function gerarEstrelas(quantidade) {
  return [...Array(5)].map((_, i) =>
    `<ion-icon name="${i < quantidade ? 'star' : 'star-outline'}"></ion-icon>`
  ).join('');
}

function usuarioEhDono(produto) {
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
  return usuario && usuario._id === produto.usuarioId;
}

// =============================================
// USUÁRIO
// =============================================
function verificarUsuarioLogado() {
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
  const saudacaoElement = document.getElementById('saudacao');

  if (usuario?.nome && saudacaoElement) {
    saudacaoElement.textContent = `Olá, ${usuario.nome.split(' ')[0]}!`;
  }
}

// =============================================
// FEEDBACK VISUAL
// =============================================
function mostrarFeedback(mensagem, tipo = 'info') {
  const feedback = document.createElement('div');
  feedback.className = `feedback ${tipo}`;
  feedback.innerHTML = `<p>${mensagem}</p>`;
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.classList.add('fade-out');
    setTimeout(() => feedback.remove(), 300);
  }, 3000);
}

// =============================================
// EXPORTA PARA USO GLOBAL
// =============================================
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.removerDoCarrinho = removerDoCarrinho;
window.limparCarrinho = limparCarrinho;
window.finalizarCompra = finalizarCompra;
window.menucelular = menucelular;
window.editarProduto = function (produtoId) {
  window.location.href = `/paginas/editar-produto.html?id=${produtoId}`;
};