const API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost' ? 
            'http://localhost:3000/api' : 
            '/api',
    timeout: 5000
};

// Configurações globais
const config = {
    placeholderImage: '../assets/img/placeholder.png'
};

// Variáveis globais
let produtosCarregados = [];

// Funções do Menu
function setupMenuMobile() {
    const MenuItens = document.getElementById("MenuItens");
    if (!MenuItens) return;
    
    MenuItens.style.maxHeight = "0px";
    document.querySelector('.menu-celular')?.addEventListener('click', function() {
        MenuItens.style.maxHeight = MenuItens.style.maxHeight === "0px" ? "200px" : "0px";
    });
}

// Funções do Carrinho
function setupCarrinho() {
    const carrinhoIcone = document.querySelector('.carrinho-icone');
    if (!carrinhoIcone) return;

    carrinhoIcone.addEventListener('click', toggleCarrinho);
    document.addEventListener('click', fecharCarrinho);
    document.getElementById('finalizar-compra')?.addEventListener('click', finalizarCompra);
    
    atualizarCarrinho();
}

function toggleCarrinho(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('carrinho-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

function fecharCarrinho() {
    const dropdown = document.getElementById('carrinho-dropdown');
    if (dropdown) dropdown.classList.remove('show');
}

function atualizarCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const contador = document.getElementById('contador-carrinho');
    const lista = document.getElementById('lista-carrinho');
    const total = document.getElementById('total-carrinho');
    
    if (contador) contador.textContent = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
    
    if (lista && total) {
        lista.innerHTML = carrinho.map(item => `
            <div class="item-carrinho">
                <img src="${item.imagem}" alt="${item.nome}" onerror="this.src='${config.placeholderImage}'">
                <div class="item-info">
                    <h4>${item.nome}</h4>
                    <p>R$ ${item.preco.toFixed(2)} x ${item.quantidade}</p>
                    <p><strong>R$ ${(item.preco * item.quantidade).toFixed(2)}</strong></p>
                </div>
                <button class="remover-item" onclick="removerDoCarrinho('${item._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        const totalCarrinho = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
        total.textContent = `Total: R$ ${totalCarrinho.toFixed(2)}`;
    }
}

function removerDoCarrinho(produtoId) {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    carrinho = carrinho.filter(item => item._id !== produtoId);
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinho();
    mostrarFeedback('Item removido do carrinho!');
}

function limparCarrinho() {
    localStorage.removeItem('carrinho');
    atualizarCarrinho();
    mostrarFeedback('Carrinho limpo com sucesso!', 'sucesso');
}

function finalizarCompra() {
    mostrarFeedback('Compra finalizada com sucesso!', 'sucesso');
    limparCarrinho();
}

// Funções Globais
window.adicionarAoCarrinho = function(produtoId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const produto = window.produtosCarregados?.find(p => p._id === produtoId);
    if (!produto) return;

    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const itemExistente = carrinho.find(item => item._id === produtoId);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            _id: produto._id,
            nome: produto.nome,
            preco: produto.preco,
            imagem: produto.fotos[0] || config.placeholderImage,
            quantidade: 1
        });
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinho();
    mostrarFeedback(`${produto.nome} adicionado ao carrinho!`);
};

function mostrarFeedback(mensagem, tipo = 'info') {
    const feedback = document.getElementById('feedback') || document.body;
    const div = document.createElement('div');
    div.className = `feedback-mensagem ${tipo}`;
    div.innerHTML = `<p>${mensagem}</p>`;
    feedback.appendChild(div);
    
    setTimeout(() => {
        div.remove();
    }, 3000);
}

// Funções de Produtos
async function carregarProdutosHome() {
    try {
        const [destaques, novidades] = await Promise.all([
            fetch(`${API_CONFIG.baseUrl}/produtos/listar?destaque=true&limit=4`).then(handleResponse),
            fetch(`${API_CONFIG.baseUrl}/produtos/listar?novidades=true&limit=8`).then(handleResponse)
        ]);

        renderizarProdutos(destaques.produtos || [], 'produtos-destaque');
        renderizarProdutos(novidades.produtos || [], 'produtos-novidades');
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showError('produtos-destaque', error);
        showError('produtos-novidades', error);
    }
}

function handleResponse(response) {
    if (!response.ok) throw new Error(`Erro ${response.status}`);
    return response.json();
}

function showError(containerId, error) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar: ${error.message}</p>
            </div>
        `;
    }
}

function renderizarProdutos(produtos, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !produtos) return;

    container.innerHTML = produtos.map(produto => `
        <div class="produto-card">
            <a href="/paginas/detalhes-produto.html?id=${produto._id}">
                <img src="${produto.fotos[0] || config.placeholderImage}" 
                     alt="${produto.nome}"
                     onerror="this.src='${config.placeholderImage}'">
            </a>
            <h3>${produto.nome}</h3>
            <p>R$ ${produto.preco.toFixed(2)}</p>
            <button onclick="adicionarAoCarrinho('${produto._id}', event)">Comprar</button>
        </div>
    `).join('');
}

// Funções de Usuário
function verificarUsuarioLogado() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    const saudacao = document.getElementById('saudacao');
    const editarContainer = document.getElementById('editar-container');
    
    if (saudacao) {
        saudacao.textContent = usuario ? `Olá, ${usuario.nome}` : '';
    }
    
    if (editarContainer && usuario) {
        editarContainer.style.display = 'block';
    }
}

// Inicialização
function inicializar() {
    setupMenuMobile();
    setupCarrinho();
    verificarUsuarioLogado();
    
    if (document.getElementById('produtos-destaque')) {
        carregarProdutosHome();
    }
}

// Inicia quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    inicializar();
    
    if (document.getElementById('lista-produtos')) {
        setTimeout(() => {
            const event = new Event('DOMContentLoaded');
            document.dispatchEvent(event);
        }, 100);
    }
    
    atualizarCarrinho();
});