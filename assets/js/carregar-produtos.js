document.addEventListener('DOMContentLoaded', async function() {
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
          <img src="${produto.fotos[0] || '../assets/img/placeholder.jpg'}" 
               alt="${produto.nome}"
               class="produto-imagem"
               onerror="this.src='../assets/img/placeholder.jpg'">
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