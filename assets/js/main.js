// js/main.js

// --- 1. IMPORTAÇÕES ---
import { inicializarProdutos, renderizarProdutos, configurarEventosProdutos } from './pages/produtos.js';
import { setupCarrinho } from './modules/carrinho.js';
import { mostrarFeedback, criarLoader, criarMensagemErro, mostrarErro } from './modules/ui.js';
import { getProdutos } from './modules/store.js';
import { verificarEAtualizarSessao } from './modules/utils.js'; 

// --- 2. DISPONIBILIZAÇÃO GLOBAL ---
// Para scripts antigos ou inline que ainda possam precisar delas
window.criarLoader = criarLoader;
window.criarMensagem = criarMensagemErro;
window.mostrarFeedback = mostrarFeedback;
window.mostrarErro = mostrarErro;

// --- 3. LÓGICA PRINCIPAL DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {

    // --- VERIFICAÇÃO GLOBAL DA SESSÃO ---
    const usuario = await verificarEAtualizarSessao();
    
    // --- CONTROLE DE ACESSO À UI (usando o 'usuario' sempre atualizado) ---
    const linkAddProduto = document.getElementById('link-add-produto');
    const iconeCarrinho = document.getElementById('icone-carrinho');
    const linkLogin = document.getElementById('link-login'); // Assumindo que você tem um link de login
    const linkConta = document.getElementById('link-conta');
    
    // Mostra/esconde o ícone do carrinho
    if (iconeCarrinho) {
        iconeCarrinho.style.display = usuario ? 'block' : 'none';
    }
    
     if (usuario) {
        // --- USUÁRIO LOGADO ---
        if (linkLogin) linkLogin.classList.remove('visivel');
        if (linkConta) linkConta.classList.add('visivel');
        
        // Mostra "Adicionar Produto" se for vendedor/admin
        if (linkAddProduto && (usuario.cargo === 'vendedor' || usuario.cargo === 'administrador')) {
            linkAddProduto.classList.add('visivel');
        }

    } else {
        // --- VISITANTE ---
        if (linkLogin) linkLogin.classList.add('visivel');
        if (linkConta) linkConta.classList.remove('visivel');
        if (linkAddProduto) linkAddProduto.classList.remove('visivel');
    }
    
    // --- INICIALIZAÇÃO DOS MÓDULOS ---
    if (document.getElementById('produtos-destaque') || document.getElementById('produtos-lista')) {
        inicializarProdutos();
    }
    setupCarrinho();

    // --- LÓGICA DE FILTRO E PESQUISA ---
    const inputPesquisa = document.getElementById('input-pesquisa');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const containerProdutos = document.getElementById('produtos-lista');

    function aplicarFiltros() {
        // 1. Pega a lista de produtos diretamente do store, não do 'window'.
        const todosProdutos = getProdutos(); 
        
        // 2. Garante que temos produtos para filtrar antes de continuar.
        if (!todosProdutos || todosProdutos.length === 0) {
            console.warn("Tentativa de filtrar, mas a lista de produtos do store está vazia.");
            return; 
        }

        const termo = inputPesquisa?.value.trim().toLowerCase() || '';
        const categoriaSelecionada = filtroCategoria?.value || '';
        
        const filtrados = todosProdutos.filter(p => {
            const correspondeBusca = p.nome.toLowerCase().includes(termo) || (p.descricao && p.descricao.toLowerCase().includes(termo));
            const correspondeCategoria = categoriaSelecionada === '' || p.categoria === categoriaSelecionada;
            return correspondeBusca && correspondeCategoria;
        });

        if (containerProdutos) {
            const basePath = window.location.pathname === '/index.html' || window.location.pathname === '/' ? 'paginas/' : '';
            containerProdutos.innerHTML = filtrados.length > 0
                ? renderizarProdutos(filtrados, basePath)
                : criarMensagemErro('Nenhum produto corresponde à sua busca.', 'info');
            configurarEventosProdutos();
        }
    }

    if (inputPesquisa) inputPesquisa.addEventListener('input', aplicarFiltros);
    if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltros);
});