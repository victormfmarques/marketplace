// assets/js/pages/editar-produto.js
import { mostrarFeedback, renderizarPreviewFotos, previewImagensInput } from '../modules/ui.js';
import { pegarFotoProduto } from '../modules/utils.js';

let fotosOriginais = [];
let novaFotoSelecionada = false;

document.addEventListener('DOMContentLoaded', async () => {
    const produtoId = new URLSearchParams(window.location.search).get('id');
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

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

    try {
        const params = new URLSearchParams({ rota: 'produtos/detalhes', id: produtoId });
        const response = await fetch(`/api?${params.toString()}`);
        if (!response.ok) throw new Error('Erro ao buscar produto');

        const produto = await response.json();
        if (produto.usuarioId !== usuarioLogado._id && usuarioLogado.cargo !== 'administrador') {
            mostrarFeedback('Você não tem permissão para editar este produto.', 'erro');
            setTimeout(() => window.location.href = '/paginas/produtos.html', 2000);
            return;
        }

        preencherFormulario(produto);
    } catch (err) {
        mostrarFeedback('Falha ao carregar dados do produto.', 'erro');
        console.error(err);
    }

    configurarFormularioEdicao(produtoId, usuarioLogado);
    configurarModalExclusao(produtoId, usuarioLogado);
});

function preencherFormulario(produto) {
    document.getElementById('nome').value = produto.nome;
    document.getElementById('descricao').value = produto.descricao;
    document.getElementById('preco').value = produto.preco.toFixed(2);
    document.getElementById('categoria').value = produto.categoria;

    fotosOriginais = [];

    if (produto.fotos && produto.fotos.length > 0) {
        const foto = produto.fotos[0];
        fotosOriginais.push(typeof foto === 'string' ? foto : foto.url);
    }

    renderizarPreviewFotos('preview-fotos', fotosOriginais, {
        titulo: 'Imagem atual do produto',
        corBorda: '#999',
        icone: 'fa-image'
    });
}

function configurarFormularioEdicao(produtoId, usuario) {
    const form = document.getElementById('form-editar-produto');
    const inputFoto = document.getElementById('foto');
    const btnRemoverFoto = document.getElementById('btn-remover-nova-foto');

    if (!form) return;

    if (inputFoto) {
        previewImagensInput(inputFoto, 'preview-fotos', {
            titulo: 'Nova imagem selecionada:',
            corBorda: '#1f5e21ff'
        });

        inputFoto.addEventListener('change', () => {
            if (!inputFoto.files.length) return;

            novaFotoSelecionada = true;
            btnRemoverFoto.classList.remove('hidden');
        });
    }

    btnRemoverFoto.addEventListener('click', () => {
        inputFoto.value = '';
        novaFotoSelecionada = false;
        btnRemoverFoto.classList.add('hidden');

        // Re-renderizar fotos originais
        renderizarPreviewFotos('preview-fotos', fotosOriginais, {
            titulo: 'Imagem atual do produto',
            corBorda: '#999',
            icone: 'fa-image'
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const modal = document.getElementById('modal-confirmar-edicao');
        const btnConfirmar = document.getElementById('btn-confirmar-edicao');
        const btnCancelar = document.getElementById('btn-cancelar-edicao');

        modal.classList.remove('hidden');
        btnCancelar.onclick = () => modal.classList.add('hidden');

        btnConfirmar.onclick = async () => {
            modal.classList.add('hidden');

            const dados = {
                nome: document.getElementById('nome').value,
                descricao: document.getElementById('descricao').value,
                preco: parseFloat(document.getElementById('preco').value),
                categoria: document.getElementById('categoria').value,
                fotoBase64: inputFoto.files[0] ? await fileToBase64(inputFoto.files[0]) : null
            };

            try {
                const response = await fetch(`/api?rota=produtos/editar&id=${produtoId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-usuario': JSON.stringify(usuario) },
                    body: JSON.stringify(dados)
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Erro na atualização.');
                }

                mostrarFeedback('Produto atualizado com sucesso!', 'sucesso');
                setTimeout(() => window.location.href = `/paginas/detalhes-produto.html?id=${produtoId}`, 2000);
            } catch (error) {
                mostrarFeedback(`Erro: ${error.message}`, 'erro');
                console.error(error);
            }
        };
    });
}

function configurarModalExclusao(produtoId, usuario) {
    const btnAbrir = document.getElementById('btn-excluir');
    const modal = document.getElementById('modal-excluir-produto');
    if (!btnAbrir || !modal) return;

    const btnConfirmar = document.getElementById('confirmar-exclusao');
    const btnCancelar = document.getElementById('cancelar-exclusao');
    const senhaInput = document.getElementById('senha-confirmacao');

    btnAbrir.addEventListener('click', () => {
        senhaInput.value = '';
        modal.classList.remove('hidden');
    });

    senhaInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        btnConfirmar.click();
    }
    });

    btnCancelar.onclick = () => modal.classList.add('hidden');

    btnConfirmar.onclick = async () => {
        const senha = senhaInput.value.trim();
        if (!senha) return mostrarFeedback('Digite sua senha para confirmar.', 'aviso');

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
            mostrarFeedback(`${error.message}`, 'erro');
            console.error(error);
        }
    };
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
    });
}