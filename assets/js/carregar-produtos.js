document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('lista-produtos');
  const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
  
  try {
    container.innerHTML = '<div class="loading">Carregando produtos...</div>';
    
    const response = await fetch('/api/produtos/listar');
    const data = await response.json();

    // DEBUG: Verifique a resposta da API
    console.log('Resposta da API:', data);

    if (!response.ok || !data.success || !Array.isArray(data.produtos)) {
      throw new Error(data.error || 'Resposta inválida da API');
    }

    if (data.produtos.length === 0) {
      container.innerHTML = '<p class="no-products">Nenhum produto disponível</p>';
      return;
    }

    container.innerHTML = data.produtos.map(produto => `
      <div class="produto-card" data-id="${produto._id}">
        <a href="/paginas/detalhes-produto.html?id=${produto._id}">
          <img src="${produto.fotos[0] || '../assets/img/placeholder.jpg'}" 
               alt="${produto.nome}"
               onerror="this.src='../assets/img/placeholder.jpg'">
        </a>
        <h3>${produto.nome}</h3>
        <p>${produto.descricao || 'Sem descrição disponível'}</p>
        <span class="preco">R$ ${produto.preco.toFixed(2)}</span>
        
        ${usuarioLogado && usuarioLogado._id && produto.usuarioId && usuarioLogado._id === produto.usuarioId ? `
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