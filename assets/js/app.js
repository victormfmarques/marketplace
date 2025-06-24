// Configurações globais
const config = {
  apiBaseUrl: '/api/produtos/listar',
  placeholderImage: '../assets/img/placeholder.png'
};

// Variáveis globais
let produtosCarregados = [];
let ultimoClick = 0;

// Inicialização principal
function inicializar() {
  setupMenuMobile();
  setupCarrinho();
  verificarUsuarioLogado();

// ========== FUNÇÕES DO MENU ==========
function setupMenuMobile() {
  const MenuItens = document.getElementById("MenuItens");
  if (!MenuItens) return;
  
  MenuItens.style.maxHeight = "0px";
  document.querySelector('.menu-celular')?.addEventListener('click', function() {
    MenuItens.style.maxHeight = MenuItens.style.maxHeight === "0px" ? "200px" : "0px";
  });
}

// ========== FUNÇÕES DO CARRINHO ==========
function setupCarrinho() {
  const carrinhoIcone = document.querySelector('.carrinho-icone');
  if (!carrinhoIcone) return;

  carrinhoIcone.addEventListener('click', toggleCarrinho);
  document.addEventListener('click', fecharCarrinho);
  document.getElementById('finalizar-compra')?.addEventListener('click', finalizarCompra);
  
  atualizarCarrinho();
}

function toggleCarrinho(e) {
  e.stopPropagation();
  document.getElementById('carrinho-dropdown').classList.toggle('show');
}

function fecharCarrinho() {
  const dropdown = document.getElementById('carrinho-dropdown');
  if (dropdown) dropdown.classList.remove('show');
}

// ... (mantenha todas as funções do carrinho existentes)

// ========== FUNÇÕES GLOBAIS ==========
window.adicionarAoCarrinho = function(produtoId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const produto = window.produtosCarregados?.find(p => p._id === produtoId);
  if (!produto) return;

  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  const itemExistente = carrinho.find(item => item._id === produtoId);

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({
      _id: produto._id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.fotos[0],
      quantidade: 1
    });
  }

  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarCarrinho();
  mostrarFeedback(`${produto.nome} adicionado ao carrinho!`);
};

// ... (outras funções globais)

async function carregarProdutosHome() {
  try {
    const [destaques, novidades] = await Promise.all([
      fetch('/api/produtos/listar?destaque=true&limit=4').then(r => r.json()),
      fetch('/api/produtos/listar?novidades=true&limit=8').then(r => r.json())
    ]);

    renderizarProdutos(destaques.produtos, 'produtos-destaque');
    renderizarProdutos(novidades.produtos, 'produtos-novidades');
  } catch (error) {
    console.error('Erro ao carregar produtos da home:', error);
  }
}

// Adicione esta função de renderização
function renderizarProdutos(produtos, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !produtos) return;

  container.innerHTML = produtos.map(produto => `
    <div class="produto-card">
      <a href="/paginas/detalhes-produto.html?id=${produto._id}">
        <img src="${produto.fotos[0]}" alt="${produto.nome}">
      </a>
      <h3>${produto.nome}</h3>
      <p>R$ ${produto.preco.toFixed(2)}</p>
      <button onclick="adicionarAoCarrinho('${produto._id}', event)">Comprar</button>
    </div>
  `).join('');
}
  
  // Carrega produtos para a home se estiver na página certa
  if (document.getElementById('produtos-destaque')) {
    carregarProdutosHome();
  }
}