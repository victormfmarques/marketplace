document.addEventListener('DOMContentLoaded', async function() {
    const config = {
        apiBaseUrl: window.location.hostname === 'localhost' ? 
                   'http://localhost:3000/api/produtos/listar' : 
                   '/api/produtos/listar'
    };

    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando produtos...';
    });

    if (!document.getElementById('lista-produtos')) return;

    try {
        const response = await fetch(config.apiBaseUrl);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        const data = await response.json();
        if (!data.produtos) throw new Error('Nenhum produto encontrado');

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
                    
                    ${usuarioLogado?._id === produto.usuarioId?.toString() ? `
                        <button class="btn-editar" onclick="editarProduto('${produto._id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

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

function editarProduto(id) {
    window.location.href = `/paginas/editar-produto.html?id=${id}`;
}