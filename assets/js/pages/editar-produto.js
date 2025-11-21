// assets/js/pages/editprod.js

import { mostrarFeedback } from '../modules/ui.js';

// --- PONTO DE ENTRADA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', async () => {
    const produtoId = new URLSearchParams(window.location.search).get('id');
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    // --- GUARDA DE ROTA ---
    if (!usuarioLogado) {
        mostrarFeedback('Faça login para acessar esta página.', 'erro');
        setTimeout(() => window.location.href = '/index.html', 2000);
        return;
    }
    if (!produtoId) {
        mostrarFeedback('Produto não especificado.', 'erro');
        setTimeout(() => window.location.href = '/paginas/produtos.html', 2000);
        return;
    }

    // --- CARREGAMENTO INICIAL DO PRODUTO ---
    try {
        const params = new URLSearchParams({ rota: 'produtos/detalhes', id: produtoId });
        const response = await fetch(`/api?${params.toString()}`);
        if (!response.ok) throw new Error(`Erro ao buscar produto.`);
        
        const produto = await response.json();
        if (produto.usuarioId !== usuarioLogado._id && usuarioLogado.cargo !== 'administrador') {
            mostrarFeedback('Você não tem permissão para editar este produto.', 'erro');
            setTimeout(() => window.location.href = '/paginas/produtos.html', 2000);
            return;
        }
        preencherFormulario(produto);
    } catch (error) {
        mostrarFeedback('Falha ao carregar dados do produto.', 'erro');
        console.error(error);
    }

    // --- CONFIGURAÇÃO DOS EVENTOS ---
    configurarFormularioEdicao(produtoId, usuarioLogado);
    configurarModalExclusao(produtoId, usuarioLogado);
});


// --- FUNÇÕES AUXILIARES ---

function preencherFormulario(produto) {
    document.getElementById('nome').value = produto.nome;
    document.getElementById('descricao').value = produto.descricao;
    document.getElementById('preco').value = produto.preco.toFixed(2);
    document.getElementById('categoria').value = produto.categoria;

    const preview = document.getElementById('preview-fotos');
    preview.innerHTML = '';
    if (produto.fotos && Array.isArray(produto.fotos)) {
        produto.fotos.forEach(foto => {
            const img = document.createElement('img');
            img.src = foto.startsWith('http' ) ? foto : `https://res.cloudinary.com/ddfacpcm5/image/upload/${foto}`;
            img.style.maxWidth = '120px';
            preview.appendChild(img );
        });
    }
}

function configurarFormularioEdicao(produtoId, usuario) {
    const form = document.getElementById('form-editar-produto');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const modal = document.getElementById('modal-confirmar-edicao');
        const btnConfirmar = document.getElementById('btn-confirmar-edicao');
        const btnCancelar = document.getElementById('btn-cancelar-edicao');

        // Abre o modal usando o padrão
        modal.classList.remove('hidden');

        btnCancelar.onclick = () => modal.classList.add('hidden');

        btnConfirmar.onclick = async () => {
            modal.classList.add('hidden');
            
            const dados = {
                nome: document.getElementById('nome').value,
                descricao: document.getElementById('descricao').value,
                preco: parseFloat(document.getElementById('preco').value),
                categoria: document.getElementById('categoria').value
            };

            try {
                const response = await fetch(`/api?rota=produtos/editar&id=${produtoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-usuario': JSON.stringify(usuario) },
                    body: JSON.stringify(dados)
                });
                if (!response.ok) throw new Error('Falha na atualização.');
                
                mostrarFeedback('Produto atualizado com sucesso!', 'sucesso');
                setTimeout(() => window.location.href = `/paginas/detalhes-produto.html?id=${produtoId}`, 2000);
            } catch (error) {
                mostrarFeedback('Erro ao atualizar produto.', 'erro');
                console.error(error);
            }
        };
    });
}

function configurarModalExclusao(produtoId, usuario) {
    const btnAbrirModal = document.getElementById('btn-excluir');
    const modal = document.getElementById('modal-excluir-produto');
    if (!btnAbrirModal || !modal) return;

    const btnConfirmar = document.getElementById('confirmar-exclusao');
    const btnCancelar = document.getElementById('cancelar-exclusao');
    const inputSenha = document.getElementById('senha-confirmacao');

    btnAbrirModal.addEventListener('click', () => {
        inputSenha.value = '';
        modal.classList.remove('hidden');
    });

    btnCancelar.onclick = () => modal.classList.add('hidden');

    btnConfirmar.onclick = async () => {
        const senha = inputSenha.value.trim();
        if (!senha) {
            mostrarFeedback('Digite sua senha para confirmar.', 'aviso');
            return;
        }
        try {
            const response = await fetch(`/api?rota=produtos/editar&id=${produtoId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'x-usuario': JSON.stringify(usuario) },
                body: JSON.stringify({ senha })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro no servidor.');
            }
            
            mostrarFeedback('Produto excluído com sucesso!', 'sucesso');
            modal.classList.add('hidden');
            setTimeout(() => window.location.href = '/paginas/produtos.html', 2000);
        } catch (error) {
            mostrarFeedback(`Erro: ${error.message}`, 'erro');
            console.error(error);
        }
    };
}