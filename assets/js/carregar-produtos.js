document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('lista-produtos');
  
  try {
    // Mostra estado de carregamento
    container.innerHTML = '<div class="loading">Carregando produtos...</div>';

    const response = await fetch('/api/produtos/listar');
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const { produtos } = await response.json();
    
    if (!produtos || produtos.length === 0) {
      container.innerHTML = '<p class="no-products">Nenhum produto encontrado</p>';
      return;
    }

    // Renderização dos produtos
    container.innerHTML = produtos.map(produto => `
      <div class="produto-card" data-id="${produto._id}">
        <img src="${produto.fotos[0]}" alt="${produto.nome}" 
             onerror="this.src='/assets/img/placeholder.jpg'">
        <h3>${produto.nome}</h3>
        <p>${produto.descricao || 'Sem descrição'}</p>
        <span class="preco">R$ ${produto.preco.toFixed(2)}</span>
        <button onclick="adicionarAoCarrinho(
          '${produto.nome.replace(/'/g, "\\'")}', 
          ${produto.preco}, 
          '${produto.fotos[0]}'
        )">Comprar</button>
      </div>
    `).join('');

  } catch (error) {
    console.error('Falha ao carregar produtos:', error);
    container.innerHTML = `
      <div class="error">
        <p>Erro ao carregar produtos</p>
        <button onclick="window.location.reload()">Tentar novamente</button>
      </div>
    `;
  }
});