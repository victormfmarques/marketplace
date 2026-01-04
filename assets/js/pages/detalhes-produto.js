// js/pages/detalhes-produto.js

// --- 1. IMPORTAÇÕES ---
// Importamos tudo que a página precisa de outros módulos.
import { produtosAPI } from '../modules/api.js';
import { adicionarAoCarrinho, setupCarrinho } from '../modules/carrinho.js';
import { criarLoader, mostrarErro } from '../modules/ui.js';
import { pegarDoisPrimeirosNomes } from '../modules/utils.js';

// --- 2. FUNÇÕES DE RENDERIZAÇÃO E LÓGICA ---

// Função para exibir os dados do produto na tela
function displayProduto(produto) {
    const nomeEl = document.getElementById("produto-nome");
    const descEl = document.getElementById("produto-descricao");
    const precoEl = document.getElementById("produto-preco");
    const imagensEl = document.getElementById("produto-imagens");
    const linkVendedor = document.getElementById("link-vendedor");

    // Preenche os elementos
    document.title = `${produto.nome} - EcoMarket-SAMAVI`; // Atualiza o título da aba
    nomeEl.textContent = produto.nome;
    descEl.innerHTML = produto.descricao.replace(/\n/g, '  ');
    precoEl.textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;

    // Preenche o link do vendedor (A FUNCIONALIDADE NOVA!)
    if (linkVendedor && produto.vendedor) {
        const nomeCurto = pegarDoisPrimeirosNomes(produto.vendedor.nome);
        linkVendedor.href = `/paginas/vendedor.html?id=${produto.vendedor._id}`;
        linkVendedor.querySelector('.vendedor-nome').textContent = nomeCurto
    }

    // Renderiza as imagens
    imagensEl.innerHTML = "";

    const fotosValidas =
    Array.isArray(produto.fotos)
        ? produto.fotos.filter(f => typeof f === 'string' && f.trim() !== '')
        : [];

    const fotosParaExibir =
    fotosValidas.length > 0
        ? fotosValidas
        : ["../assets/img/placeholder.png"];

    fotosParaExibir.forEach(foto => {
    const img = document.createElement("img");
    img.src = foto;
    img.alt = `Imagem do produto: ${produto.nome}`;
    img.onerror = () => {
        img.src = "../assets/img/placeholder.png";
    };
    imagensEl.appendChild(img);
    });
}

// Função para redirecionar para a página de edição
function redirecionarParaEdicao(produtoId) {
    if (produtoId) {
        window.location.href = `/paginas/editar-produto.html?id=${produtoId}`;
    }
}

// --- 3. FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO ---

async function inicializarPagina() {
    const urlParams = new URLSearchParams(window.location.search);
    const produtoId = urlParams.get("id");
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    const container = document.getElementById("produto-container");

    // --- LÓGICA DE VISIBILIDADE DO CARRINHO ---
    const iconeCarrinho = document.getElementById('icone-carrinho');
    if (iconeCarrinho) {
        if (usuarioLogado) {
            iconeCarrinho.classList.add('visivel');
        } else {
            iconeCarrinho.classList.remove('visivel');
        }
    }

    if (!produtoId) {
        mostrarErro(container, "ID do produto não especificado", "URL inválida.");
        return;
    }

    try {
        // NÃO APAGUE O CONTAINER. Apenas mostre um efeito de carregamento.
        container.style.opacity = '0.5';
        
        const nomeEl = document.getElementById("produto-nome");
        // substitui o texto "Carregando..." pelo loader
        nomeEl.innerHTML = criarLoader('');
        
        const produto = await produtosAPI.detalhes(produtoId);
        
        // AGORA SIM, preenchemos os elementos que JÁ EXISTEM no HTML.
        displayProduto(produto);

        const btnComprar = document.getElementById("btn-comprar");
        btnComprar.addEventListener('click', (event) => {
            const sucesso = adicionarAoCarrinho(produto, event);
            if (sucesso) {
                btnComprar.textContent = "Adicionado!";
                setTimeout(() => { btnComprar.textContent = "Comprar"; }, 2000);
            }
        });

        if (usuarioLogado && usuarioLogado._id === produto.usuarioId) {
            const editarContainer = document.getElementById("editar-container");
            const btnEditar = editarContainer.querySelector('.btn-editar');
            editarContainer.style.display = "block";
            btnEditar.addEventListener('click', () => redirecionarParaEdicao(produto._id));
        }

        // Remove o efeito de carregamento.
        container.style.opacity = '1';

    } catch (error) {
        console.error("Erro ao carregar detalhes do produto:", error);
        mostrarErro(container, "Erro ao Carregar Produto", "Não foi possível encontrar os detalhes deste produto.");
        container.style.opacity = '1'; // Garante que a opacidade volte ao normal em caso de erro.
    }
}

// --- 4. PONTO DE ENTRADA ---
// Roda tudo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setupCarrinho(); // Inicializa o carrinho (importante!)
    inicializarPagina(); // Inicializa a lógica da página de detalhes
});