// =============================================
// VARIÁVEIS GLOBAIS
// =============================================
const MenuItens = document.getElementById("MenuItens");
let ultimoClick = 0;

// =============================================
// FUNÇÕES DO MENU MOBILE
// =============================================
MenuItens.style.maxHeight = "0px";

function menucelular() {
    if (MenuItens.style.maxHeight == "0px") {
        MenuItens.style.maxHeight = "200px";
    } else {
        MenuItens.style.maxHeight = "0px";
    }
}

// =============================================
// FUNÇÕES DO CARRINHO
// =============================================

// Função principal para atualizar a exibição do carrinho
function atualizarCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const listaCarrinho = document.getElementById('lista-carrinho');
    const totalCarrinho = document.getElementById('total-carrinho');
    const contador = document.getElementById('contador-carrinho');
    const botoesCarrinho = document.querySelector('.carrinho-botoes');

    // Atualiza contador
    contador.textContent = carrinho.reduce((total, item) => total + (item.quantidade || 1), 0);

    // Limpa e recria a lista
    listaCarrinho.innerHTML = '';
    let total = 0;

    carrinho.forEach((item, index) => {
        total += item.preco * (item.quantidade || 1);
        
        const itemElement = document.createElement('div');
        itemElement.className = 'item-carrinho';
        itemElement.innerHTML = `
            <img src="${item.imagem}" alt="${item.nome}">
            <div class="item-info">
                <h4>${item.nome} ${item.quantidade > 1 ? `(${item.quantidade}x)` : ''}</h4>
                <p><strong>Preço:</strong> R$ ${item.preco.toFixed(2)}</p>
                <p><strong>Subtotal:</strong> R$ ${(item.preco * (item.quantidade || 1)).toFixed(2)}</p>
            </div>
            <button class="remover-item" onclick="removerDoCarrinho(${index})">×</button>
        `;
        listaCarrinho.appendChild(itemElement);
    });

    // Atualiza totais e visibilidade dos botões
    if (totalCarrinho) {
        totalCarrinho.textContent = `Total: R$ ${total.toFixed(2)}`;
    }
    if (botoesCarrinho) {
        botoesCarrinho.style.display = carrinho.length > 0 ? 'flex' : 'none';
    }
}

// Função para adicionar itens ao carrinho com debounce
function adicionarAoCarrinho(nome, preco, imagem) {
    const agora = Date.now();
    if (agora - ultimoClick < 500) return;
    ultimoClick = agora;

    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const itemExistente = carrinho.find(item => item.nome === nome && item.preco === preco);

    if (itemExistente) {
        itemExistente.quantidade = (itemExistente.quantidade || 1) + 1;
    } else {
        carrinho.push({ nome, preco, imagem, quantidade: 1 });
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinho();
    mostrarFeedback(`${nome} adicionado ao carrinho!`);
}

// Função para remover itens do carrinho
function removerDoCarrinho(index) {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    carrinho.splice(index, 1);
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinho();
}

// Função para limpar todo o carrinho
function limparCarrinho() {
    if (confirm('Tem certeza que deseja remover todos os itens do carrinho?')) {
        localStorage.removeItem('carrinho');
        atualizarCarrinho();
        mostrarFeedback('Carrinho limpo com sucesso! 🌿', 'sucesso');
    }
}

// Função para finalizar compra
function finalizarCompra() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    if (carrinho.length === 0) {
        mostrarFeedback('Seu carrinho está vazio! 🛒', 'info');
        return;
    }

    localStorage.removeItem('carrinho');
    atualizarCarrinho();
    mostrarFeedback('Compra finalizada com sucesso! ✅', 'sucesso');
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

// Mostra feedback visual ao usuário
function mostrarFeedback(mensagem, tipo = 'info') {
    const feedback = document.createElement('div');
    feedback.className = `feedback-mensagem ${tipo}`;
    feedback.textContent = mensagem;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => feedback.remove(), 300);
    }, 2000);
}

// =============================================
// EVENT LISTENERS
// =============================================

// Configura eventos dos produtos
document.querySelectorAll('.col-4').forEach(produto => {
    produto.addEventListener('click', function(e) {
        if (e.target.classList.contains('remover-item') || 
            e.target.tagName === 'BUTTON' || 
            e.target.tagName === 'ION-ICON') return;
        
        const nome = this.querySelector('h4').textContent;
        const precoTexto = this.querySelector('p').textContent;
        const preco = parseFloat(precoTexto.replace('R$ ', '').replace(',', '.'));
        const imagem = this.querySelector('img').src;

        adicionarAoCarrinho(nome, preco, imagem);
    });
});

// Eventos do carrinho
document.querySelector('.carrinho-icone')?.addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('carrinho-dropdown').classList.toggle('show');
});

document.addEventListener('click', () => {
    document.getElementById('carrinho-dropdown').classList.remove('show');
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    atualizarCarrinho();
});

// Configura evento do botão de finalizar compra
document.getElementById('finalizar-compra')?.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    finalizarCompra();
});
