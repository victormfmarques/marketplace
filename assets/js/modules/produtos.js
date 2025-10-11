// assets/js/modules/produtos.js
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

function renderizarProdutos(produtos) {
  return produtos.map(produto => `
    <div class="produto-card" data-id="${produto.id || produto._id}">
      <a href="detalhes-produto.html?id=${produto.id || produto._id}" class="produto-link" tabindex="0" aria-label="Detalhes do produto ${produto.nome}">
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
      if (window.adicionarAoCarrinho) {
        window.adicionarAoCarrinho(produtoId, e);
      } else {
        console.error('Função adicionarAoCarrinho não está disponível');
      }
    });
  });
}

// -------------------- FUNÇÕES PRINCIPAIS --------------------

export async function carregarProdutos(containerId, params = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    container.innerHTML = window.criarLoader("Carregando produtos...");

    params._ = new Date().getTime();
    const queryString = new URLSearchParams(params).toString();
    const url = `/api?rota=produtos/listar&${queryString}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    //throw new Error("Teste de erro para verificar layout");
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Erro na resposta da API');

    if (!result.data || result.data.length === 0) {
      container.innerHTML = window.criarMensagem('Nenhum produto disponível', 'info');
      return;
    }

    window.produtosCarregados = result.data;
    container.innerHTML = renderizarProdutos(result.data);
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

export function adicionarAoCarrinho(produtoId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  let produto = window.produtosCarregados?.find(p => p.id === produtoId) 
                || (window.produtoAtual?.id === produtoId ? window.produtoAtual : null);

  if (!produto) {
    console.warn(`Produto com id ${produtoId} não encontrado para adicionar ao carrinho.`);
    return;
  }

  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  const itemExistente = carrinho.find(item => item.id === produtoId);

  if (itemExistente) itemExistente.quantidade += 1;
  else carrinho.push({
    id: produto.id || produto._id,
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

  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  window.mostrarFeedback(`${produto.nome} adicionado ao carrinho!`);
}

// -------------------- PRODUTOS DO USUÁRIO --------------------

const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

if (usuarioLogado) {
  async function carregarProdutosUsuario() {
    const container = document.getElementById('produtos-usuario');
    if (!container) return;

    try {
      container.innerHTML = window.criarLoader("Carregando seus produtos...");

      const params = new URLSearchParams({
        rota: 'perfil/produtos-usuario',
        usuarioId: usuarioLogado._id,
        _: new Date().getTime()
      });
      
      const response = await fetch(`/api?${params.toString()}`);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      //throw new Error("Teste de erro para verificar layout");

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Erro na resposta da API');

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
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.carregarProdutos = carregarProdutos;
window.inicializarProdutos = inicializarProdutos;

export { renderizarProdutos, configurarEventosProdutos };

window.addEventListener('resize', () => {
  clearTimeout(window.__resizeTimer);
  window.__resizeTimer = setTimeout(() => {
    if (document.getElementById('produtos-destaque')) inicializarProdutos();
  }, 300);
});