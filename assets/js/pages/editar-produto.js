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
    preview.dataset.fotosAtuais = JSON.stringify(produto.fotos || []); // Guarda as fotos atuais
    
    if (produto.fotos && Array.isArray(produto.fotos)) {
        produto.fotos.forEach(foto => {
            const img = document.createElement('img');
            img.src = foto.startsWith('http') ? foto : `https://res.cloudinary.com/ddfacpcm5/image/upload/${foto}`;
            img.style.maxWidth = '120px';
            img.style.margin = '5px';
            img.style.border = '2px solid #ccc';
            preview.appendChild(img);
        });
    }
}

function configurarFormularioEdicao(produtoId, usuario) {
    const form = document.getElementById('form-editar-produto');
    const inputFotos = document.getElementById('fotos');
    const previewFotos = document.getElementById('preview-fotos');
    
    if (!form) return;

    // Configurar pré-visualização das NOVAS fotos
    if (inputFotos) {
        inputFotos.addEventListener('change', function() {
            const files = Array.from(this.files);
            
            // Limpa apenas as novas previews, mantém as antigas
            const fotosNovasContainer = document.getElementById('preview-novas-fotos');
            if (!fotosNovasContainer) {
                const novasContainer = document.createElement('div');
                novasContainer.id = 'preview-novas-fotos';
                novasContainer.innerHTML = '<p><strong>Nova foto selecionada:</strong></p>';
                novasContainer.style.color = '#4F4F4F';
                previewFotos.parentNode.insertBefore(novasContainer, previewFotos.nextSibling);
            } else {
                fotosNovasContainer.innerHTML = '<p><strong>Nova foto selecionada:</strong></p>';
                fotosNovasContainer.style.color = '#4F4F4F';
            }
            
            const container = document.getElementById('preview-novas-fotos');
            
            // Mostra as NOVAS fotos selecionadas
            files.forEach(file => {
                if (!file.type.startsWith('image/')) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '120px';
                    img.style.margin = '5px';
                    img.style.border = '2px solid #1f5e21ff';
                    container.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
            
            console.log(`${files.length} nova(s) foto(s) selecionada(s)`);
        });
    }

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
                categoria: document.getElementById('categoria').value,
                fotosBase64: [] // AGORA VAI TER AS NOVAS IMAGENS
            };

            // Processar as NOVAS fotos selecionadas (se houver)
            if (inputFotos && inputFotos.files.length > 0) {
                console.log(`Convertendo ${inputFotos.files.length} nova(s) imagem(ns) para base64...`);
                
                try {
                    const files = Array.from(inputFotos.files);
                    
                    for (const file of files) {
                        if (file.type.startsWith('image/')) {
                            const base64 = await fileToBase64(file);
                            dados.fotosBase64.push(base64);
                        }
                    }
                    
                    console.log(`${dados.fotosBase64.length} nova(s) imagem(ns) pronta(s) para upload`);
                } catch (error) {
                    console.error('Erro ao converter imagens:', error);
                    mostrarFeedback('Erro ao processar imagens', 'erro');
                    return;
                }
            } else {
                console.log('Nenhuma nova imagem selecionada - mantendo as fotos atuais');
            }

            try {
                console.log('Enviando para edição:', {
                    ...dados,
                    fotosBase64: dados.fotosBase64.length > 0 ? `[${dados.fotosBase64.length} imagem(ns)]` : 'nenhuma'
                });
                
                const response = await fetch(`/api?rota=produtos/editar&id=${produtoId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'x-usuario': JSON.stringify(usuario) 
                    },
                    body: JSON.stringify(dados)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Falha na atualização.');
                }
                
                const result = await response.json();
                console.log('Resposta da API:', result);
                
                mostrarFeedback('Produto atualizado com sucesso!', 'sucesso');
                setTimeout(() => window.location.href = `/paginas/detalhes-produto.html?id=${produtoId}`, 2000);
            } catch (error) {
                console.error('Erro completo:', error);
                mostrarFeedback(`Erro: ${error.message}`, 'erro');
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

// Função auxiliar para converter arquivo em base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}