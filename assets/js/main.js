// js/main.js

// --- 1. IMPORTAÇÕES ---
import { inicializarProdutos, renderizarProdutos, configurarEventosProdutos } from './pages/produtos.js';
import { setupCarrinho } from './modules/carrinho.js';
import { mostrarFeedback, criarLoader, criarMensagemErro, mostrarErro } from './modules/ui.js';
import { getProdutos } from './modules/store.js';

// --- 2. DISPONIBILIZAÇÃO GLOBAL ---
// Para scripts antigos ou inline que ainda possam precisar delas
window.criarLoader = criarLoader;
window.criarMensagem = criarMensagemErro;
window.mostrarFeedback = mostrarFeedback;
window.mostrarErro = mostrarErro;

// --- 3. LÓGICA PRINCIPAL DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONTROLE DE ACESSO À UI ---
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    const linkAddProduto = document.getElementById('link-add-produto');
    const iconeCarrinho = document.getElementById('icone-carrinho');

    // Lógica para o Ícone do Carrinho (visível para qualquer usuário logado)
    if (iconeCarrinho) {
        if (usuario) {
            iconeCarrinho.style.display = 'block'; // ou 'inline-block'
        } else {
            iconeCarrinho.style.display = 'none';
        }
    }
    
    // Lógica para o Botão "Adicionar Produto" (visível APENAS para vendedores)
    if (linkAddProduto) {
        if (usuario && usuario.cargo === 'vendedor') {
            linkAddProduto.style.display = 'block'; // ou 'inline-block'
        } else {
            linkAddProduto.style.display = 'none';
        }
    }

    // --- INICIALIZAÇÃO DOS MÓDULOS ---
    inicializarProdutos();
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
                : '<p style="text-align:center;">Nenhum produto encontrado para sua busca.</p>';
            configurarEventosProdutos();
        }
    }

    if (inputPesquisa) inputPesquisa.addEventListener('input', aplicarFiltros);
    if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltros);
});