document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/produtos/listar');
    const { produtos } = await response.json();
    
    const container = document.getElementById('lista-produtos');
    container.innerHTML = produtos.map(produto => `
      <div class="produto-card">
        <img src="${produto.fotos[0]}" alt="${produto.nome}">
        <h3>${produto.nome}</h3>
        <p>${produto.descricao}</p>
        <span class="preco">R$ ${produto.preco.toFixed(2)}</span>
        <span class="categoria ${produto.categoria}">${produto.categoria}</span>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
});

async function filtrarPorCategoria(categoria) {
  const response = await fetch(`/api/produtos/listar?categoria=${categoria}`);
  // ... atualize a lista ...
}