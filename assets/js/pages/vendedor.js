// js/pages/vendedor.js

// =========================== IMPORTAÇÕES ===============================
import { vendedorAPI } from '../modules/api.js';
import { criarLoader } from '../modules/ui.js';
import { formatarTelefone } from '../modules/utils.js';
// =======================================================================

// --- FUNÇÕES DE RENDERIZAÇÃO ---

function renderizarHeader(vendedor) {
    const header = document.querySelector('.perfil-header');
    if (!header) return;

    // Monta o HTML do contato apenas se os dados existirem
    let contatoHTML = '';
    if (vendedor.email || vendedor.telefone) {
        const telefoneFormatado = vendedor.telefone ? formatarTelefone(vendedor.telefone) : '';
        contatoHTML = `
            <div class="vendedor-contato">
                <a href="mailto:${vendedor.email}" target="_blank">${vendedor.email ? `<span><i class="fas fa-envelope"></i> ${vendedor.email}</span>` : ''}</a>
                <a href="http://wa.me/${vendedor.telefone}" target="_blank" rel="noopener">${telefoneFormatado ? `<span><i class="fas fa-phone"></i> ${telefoneFormatado}</span>` : ''}</a>
            </div>
        `;
    }

    // Renderiza tudo de uma vez
    header.innerHTML = `
        <img src="${vendedor.fotoPerfil || '/assets/img/placeholder-perfil.png'}" alt="Foto de ${vendedor.nome}" class="vendedor-foto">
        <h1 class="vendedor-nome">${vendedor.nome}</h1>
        ${contatoHTML}
        <nav class="perfil-nav">
            <a href="/index.html" class="nav-button"><ion-icon name="home-outline"></ion-icon> Início</a>
            <a href="javascript:history.back()" class="nav-button"><i class="fas fa-arrow-left"></i> Voltar</a>
        </nav>
    `;
}

function renderizarSobre(vendedor) {
    const sobreTexto = document.querySelector('.vendedor-sobre-texto');
    if (!sobreTexto) return;

    sobreTexto.textContent = vendedor.sobre || 'Este vendedor ainda não escreveu sobre si mesmo.';
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

    if (!vendedorId) {
        document.body.innerHTML = '<h1>Erro: ID do vendedor não fornecido.</h1>';
        return;
    }

    const grid = document.getElementById('produtos-grid');
    if (grid) grid.innerHTML = criarLoader('Carregando perfil...');

    try {
        const data = await vendedorAPI.getPerfil(vendedorId);

        // Define o título da página
        document.title = `${data.vendedor.nome} - AssociArte Marketplace`;

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