document.addEventListener('DOMContentLoaded', async function() {
  const config = {
    apiBaseUrl: window.location.hostname === 'localhost' ? 
               'http://localhost:3000/api/produtos/listar' : 
               '/api/produtos/listar'
};

// Modifique a função principal para:
document.addEventListener('DOMContentLoaded', async function() {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando produtos...';
    });

    try {
        const response = await fetch(config.apiBaseUrl);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        // Restante do código permanece igual...
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        const container = document.getElementById('lista-produtos') || 
                         document.getElementById('produtos-destaque') ||
                         document.getElementById('produtos-novidades');
        
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Não foi possível carregar os produtos</p>
                    <button onclick="window.location.reload()" class="btn-retry">
                        <i class="fas fa-sync-alt"></i> Tentar novamente
                    </button>
                </div>
            `;
        }
    }
});
  
  // Só executa se estiver na página de produtos
  if (!document.getElementById('lista-produtos')) return;

  try {
    const response = await fetch('/api/produtos/listar');
    const data = await response.json();
    
    if (!response.ok || !data.produtos) {
      throw new Error(data.error || 'Resposta inválida da API');
    }

    // Armazena para uso no carrinho
    window.produtosCarregados = data.produtos;

    const container = document.getElementById('lista-produtos');
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    
    container.innerHTML = data.produtos.map(produto => `
      <div class="produto-card">
        <a href="/paginas/detalhes-produto.html?id=${produto._id}">
          <img src="${produto.fotos[0] || '../assets/img/placeholder.png'}" 
               alt="${produto.nome}"
               class="produto-imagem"
               onerror="this.src='../assets/img/placeholder.png'">
        </a>
        <div class="produto-info">
          <h3>${produto.nome}</h3>
          <p>${produto.descricao || 'Sem descrição'}</p>
          <span class="preco">R$ ${produto.preco.toFixed(2)}</span>
          <button onclick="adicionarAoCarrinho('${produto._id}', event)">Comprar</button>
          
          ${usuarioLogado?.id === produto.usuarioId ? `
            <button onclick="editarProduto('${produto._id}')">Editar</button>
          ` : ''}
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    const container = document.getElementById('lista-produtos');
    container.innerHTML = `
      <div class="error">
        <p>Falha ao carregar produtos</p>
        <button onclick="window.location.reload()">Tentar novamente</button>
      </div>
    `;
  }
});

function editarProduto(id) {
  window.location.href = `/paginas/editar-produto.html?id=${id}`;
}