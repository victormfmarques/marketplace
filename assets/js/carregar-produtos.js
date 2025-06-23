document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('lista-produtos');
  const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
  
  try {
    container.innerHTML = '<div class="loading">Carregando produtos...</div>';
    
    const response = await fetch('/api/produtos/listar');
    const data = await response.json();

    if (!response.ok || !data.produtos) {
      throw new Error(data.error || 'Resposta inválida da API');
    }

    if (data.produtos.length === 0) {  // Corrigido para data.produtos
      container.innerHTML = '<p class="no-products">Nenhum produto disponível</p>';
      return;
    }

    // Corrigido: usar data.produtos em vez de produtos
    container.innerHTML = data.produtos.map(produto => `
      <div class="produto-card" data-id="${produto._id}">
        <a href="/paginas/detalhes-produto.html?id=${produto._id}">
          <img src="${produto.fotos[0] || 'placeholder.jpg'}" 
               alt="${produto.nome}"
               onerror="this.src='placeholder.jpg'">
        </a>
        <h3>${produto.nome}</h3>
        <p>${produto.descricao || 'Sem descrição'}</p>
        <span class="preco">R$ ${produto.preco?.toFixed(2) || '0,00'}</span>
        
        ${usuarioLogado && usuarioLogado._id === produto.usuarioId ? `
          <div class="produto-acoes">
            <button onclick="editarProduto('${produto._id}')">Editar</button>
          </div>
        ` : ''}
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

function editarProduto(id) {
  window.location.href = `/paginas/editar-produto.html?id=${id}`;
}