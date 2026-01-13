// js/pages/vendedor.js

// =========================== IMPORTAÇÕES ===============================
import { vendedorAPI } from '../modules/api.js';
import { criarLoader, mostrarFeedback } from '../modules/ui.js';
import { formatarTelefone } from '../modules/utils.js';
// =======================================================================

// --- FUNÇÕES DE RENDERIZAÇÃO ---

function renderizarHeader(vendedor) {
    const header = document.querySelector('.perfil-header');
    if (!header) return;

    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const produtoId = params.get('produto');

    // --- BOTÃO VOLTAR INTELIGENTE ---
    let voltarHTML = '';
    if (from === 'produto' && produtoId) {
        voltarHTML = `
            <a href="/paginas/detalhes-produto.html?id=${produtoId}" class="nav-button">
                <i class="fas fa-arrow-left"></i> Voltar ao produto
            </a>
        `;
    } else {
        voltarHTML = `
            <a href="/paginas/produtos.html" class="nav-button">
                <i class="fas fa-store"></i> Voltar à loja
            </a>
        `;
    }

    // --- CONTATO ---
    let contatoHTML = '';
    if (vendedor.email || vendedor.telefone) {
        const telefoneFormatado = vendedor.telefone ? formatarTelefone(vendedor.telefone) : '';
        contatoHTML = `
            <div class="vendedor-contato">
                ${vendedor.email ? `
                    <a href="mailto:${vendedor.email}">
                        <i class="fas fa-envelope"></i> ${vendedor.email}
                    </a>` : ''}
                ${vendedor.telefone ? `
                    <a href="https://wa.me/${vendedor.telefone}" target="_blank" rel="noopener">
                        <i class="fab fa-whatsapp"></i> ${telefoneFormatado}
                    </a>` : ''}
            </div>
        `;
    }

    // --- RENDER ---
    header.innerHTML = `
        <div class="perfil-topo">
            <img src="${vendedor.fotoPerfil || '/assets/img/placeholder-perfil.png'}"
                 alt="Foto de ${vendedor.nome}"
                 class="vendedor-foto">

            <div class="perfil-info">
                <h1 class="vendedor-nome">${vendedor.nome}</h1>
                ${contatoHTML}
            </div>

            <button id="btn-compartilhar" class="btn-compartilhar" aria-label="Compartilhar perfil">
                <i class="fas fa-share-alt"></i>
            </button>
        </div>

        <nav class="perfil-nav">
            <a href="/index.html" class="nav-button">
                <ion-icon name="home-outline"></ion-icon> Início
            </a>
            ${voltarHTML}
        </nav>
    `;

    ativarCompartilhamento(vendedor._id);
}
function ativarCompartilhamento(vendedorId) {
    const btn = document.getElementById('btn-compartilhar');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const url = `${window.location.origin}/paginas/vendedor.html?id=${vendedorId}`;

        if (navigator.share) {
            await navigator.share({
                title: 'Perfil de artesão — ASSOCIARTE',
                text: 'Confira este artesão no marketplace ASSOCIARTE',
                url
            });
        } else {
            await navigator.clipboard.writeText(url);
            mostrarFeedback('Link do perfil copiado!', 'sucesso');
        }
    });
}

function renderizarSobre(vendedor) {
    const sobreTexto = document.querySelector('.vendedor-sobre-texto');
    if (!sobreTexto) return;

    sobreTexto.textContent =
        vendedor.sobre || 'Este vendedor ainda não escreveu sobre si mesmo.';
}

function renderizarProdutos(produtos) {
    const grid = document.getElementById('produtos-grid');
    if (!grid) return;

    if (produtos.length === 0) {
        grid.innerHTML = '<p>Este vendedor ainda não tem produtos cadastrados.</p>';
        return;
    }

    // Reutilizando o estilo dos cards de produto
    grid.innerHTML = produtos.map(produto => `
        <div class="produto-card">
            <a href="/paginas/detalhes-produto.html?id=${produto._id}" class="produto-link">
                <img 
                src="${typeof produto.fotos?.[0] === 'string'
                            ? produto.fotos[0]
                            : produto.fotos?.[0]?.url || '/assets/img/placeholder-perfil.png'
                        }" 
                loading="lazy"
                onload="this.closest('.produto-card')?.classList.add('card-img-ok')"
                alt="${produto.nome}"
                >
            </a>
            <div class="produto-info">
                <h3>${produto.nome}</h3>
                <p class="produto-preco">R$ ${(produto.preco || 0).toFixed(2).replace('.', ',')}</p>
                <!-- O botão comprar não funciona aqui, pois não temos o script do carrinho. É só uma vitrine. -->
            </div>
        </div>
    `).join('');
}

// --- FUNÇÃO PRINCIPAL (PONTO DE ENTRADA) ---

async function inicializarPagina() {
    const urlParams = new URLSearchParams(window.location.search);
    const vendedorId = urlParams.get('id');

    const sobreTexto = document.querySelector('.vendedor-sobre-texto');
    if (sobreTexto) {
        sobreTexto.innerHTML = criarLoader('Carregando descrição do vendedor...');
    }

    if (!vendedorId) {
        document.body.innerHTML = '<h1>Erro: ID do vendedor não fornecido.</h1>';
        return;
    }

    const grid = document.getElementById('produtos-grid');
    if (grid) grid.innerHTML = criarLoader('Carregando perfil...');

    try {
        const data = await vendedorAPI.getPerfil(vendedorId);

        // Define o título da página
        document.title = `${data.vendedor.nome} - ASSOCIARTE Marketplace`;

        // Renderiza cada parte da página
        renderizarHeader(data.vendedor);
        renderizarSobre(data.vendedor);
        renderizarProdutos(data.produtos);

    } catch (error) {
        console.error('Falha ao carregar perfil do vendedor:', error);
        document.body.innerHTML = `<h1>Erro ao carregar perfil. ${error.message}</h1>`;
    }
}

// --- INICIA TUDO ---
document.addEventListener('DOMContentLoaded', inicializarPagina);