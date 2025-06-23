document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('lista-produtos');
  
  try {
    container.innerHTML = '<div class="loading">Carregando produtos...</div>';
    
    const response = await fetch('/api/produtos/listar');
    const data = await response.json();

    if (!response.ok || !data.produtos) {
      throw new Error(data.error || 'Resposta inválida da API');
    }

    if (data.produtos.length === 0) {
      container.innerHTML = '<p class="no-products">Nenhum produto disponível</p>';
      return;
    }

    container.innerHTML = data.produtos.map(produto => `
      <div class="produto-card">
        <img src="${produto.fotos[0] || '/placeholder.jpg'}" 
             alt="${produto.nome}"
             onerror="this.src='/placeholder.jpg'">
        <h3>${produto.nome}</h3>
        <p>${produto.descricao || 'Descrição não disponível'}</p>
        <span class="preco">R$ ${produto.preco.toFixed(2)}</span>
        <button onclick="adicionarAoCarrinho(
          '${produto.nome.replace(/'/g, "\\'")}', 
          ${produto.preco}, 
          '${produto.fotos[0] || ''}'
        )">Adicionar ao Carrinho</button>
      </div>
    `).join('');

  } catch (error) {
    console.error('Falha ao carregar:', error);
    container.innerHTML = `
      <div class="error">
        <p>Falha ao carregar produtos</p>
        <small>${error.message}</small>
        <button onclick="location.reload()">Tentar novamente</button>
      </div>
    `;
  }
});