document.addEventListener('DOMContentLoaded', async function() {
  if (!document.getElementById('lista-produtos')) return;

  try {
    const response = await fetch('/api/produtos/listar');
    const data = await response.json();
    
    if (!response.ok || !data.produtos) throw new Error('Resposta inválida');

    window.produtosCarregados = data.produtos;
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));

    document.getElementById('lista-produtos').innerHTML = data.produtos.map(produto => `
      <div class="produto-card">
        <img src="${produto.fotos[0]}" alt="${produto.nome}">
        <h3>${produto.nome}</h3>
        <p>${produto.descricao || 'Sem descrição'}</p>
        <span>R$ ${produto.preco.toFixed(2)}</span>
        <div class="produto-acoes">
          <button onclick="adicionarAoCarrinho('${produto._id}', event)">Comprar</button>
          ${usuario?._id === produto.usuarioId ? `
            <button onclick="editarProduto('${produto._id}')" class="btn-editar">Editar</button>
          ` : ''}
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Erro:', error);
    document.getElementById('lista-produtos').innerHTML = `
      <div class="error">
        <p>Erro ao carregar produtos</p>
        <button onclick="location.reload()">Tentar novamente</button>
      </div>
    `;
  }
});