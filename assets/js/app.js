// Configurações globais
const config = {
  apiBaseUrl: '/api/produtos/listar',
  placeholderImage: '../assets/img/placeholder.png'
};

// Variáveis globais
let produtosCarregados = [];
let ultimoClick = 0;

// Inicialização principal
document.addEventListener('DOMContentLoaded', function() {
  setupMenuMobile();
  setupCarrinho();
  verificarUsuarioLogado();
});

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
};

// ... (outras funções globais)