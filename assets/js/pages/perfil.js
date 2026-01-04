// EM: assets/js/pages/perfil.js

// --- 1. IMPORTAÇÕES ---
// Todas as dependências que o arquivo precisa.
import { formatarTelefone, pegarFotoProduto } from '../modules/utils.js';
import { criarMensagemErro, mostrarFeedback, criarLoader, mostrarErro } from '../modules/ui.js';
import { perfilAPI, produtosAPI, vendedorAPI } from '../modules/api.js';

// =======================================================================
// --- 2. ESTADO GLOBAL DA PÁGINA ---
// =======================================================================
let todosOsPedidosDoVendedor = [];
let paginaAtualVendedor = 1;
let filtroAtualVendedor = 'todos';
let totalPedidosNoBanco = 0;
let carregandoPedidos = false;
let abortController = new AbortController();

// =======================================================================
// --- 3. FUNÇÕES AUXILIARES ---
// =======================================================================

/* Carrega e exibe os produtos do usuário logado na seção correspondente.*/
async function carregarProdutosUsuario() {
    const container = document.getElementById('produtos-usuario');
    if (!container) return;

    try {
        const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
        container.innerHTML = criarLoader("Carregando seus produtos...");

        const result = await produtosAPI.listarPorUsuario(usuario._id);

        if (!result.data || result.data.length === 0) {
            container.innerHTML = criarMensagemErro('Você ainda não publicou produtos.', 'info');
            return;
        }

        container.innerHTML = result.data.map(prod => {
            const foto = pegarFotoProduto(prod);

            return `
                <div class="produto-card">
                    <a href="detalhes-produto.html?id=${prod._id}">
                    <img src="${foto}" alt="${prod.nome}" onerror="this.src='/assets/img/placeholder.png'">
                    </a>
                    <div class="produto-info">
                    <h4>${prod.nome}</h4>
                    <p class="produto-preco">R$ ${parseFloat(prod.preco).toFixed(2).replace('.', ',')}</p>
                    <button class="btn-editar" onclick="window.location.href='editar-produto.html?id=${prod._id}'">Editar</button>
                    </div>
                </div>
                `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar produtos do usuário:', error);
        mostrarErro(container, 'Não foi possível carregar seus produtos', 'Ocorreu um erro no servidor. Tente novamente.', carregarProdutosUsuario);
    }
}

/**
  Preenche o formulário de dados pessoais com as informações do usuário.
 */
function preencherFormulario(usuario) {
    if (!usuario) return;

    const nomeInput = document.getElementById('inome');
    const dataInput = document.getElementById('idat');
    const telInput = document.getElementById('itel');
    const emailInput = document.getElementById('iemail');
    const saudacaoEl = document.getElementById('saudacao');

    if (nomeInput) nomeInput.value = usuario.nome || '';
    if (dataInput) dataInput.value = usuario.dataNascimento?.split('T')[0] || '';
    if (telInput) telInput.value = formatarTelefone(usuario.telefone || '');
    if (emailInput) emailInput.value = usuario.email || '';
    if (saudacaoEl) saudacaoEl.textContent = `Olá, ${usuario.nome || 'Visitante'}`;

    const sexoDoUsuario = usuario.sexo || '';
    const generoNormalizado = sexoDoUsuario.toLowerCase().trim();
    const masRadio = document.getElementById('imas');
    const femRadio = document.getElementById('ifem');

    if (masRadio) masRadio.checked = generoNormalizado === 'masculino';
    if (femRadio) femRadio.checked = generoNormalizado === 'feminino';
}

/**
 * Preenche o formulário de perfil de vendedor (foto e "sobre").
 */
function carregarDadosVendedor(usuario) {
    const fotoPreview = document.getElementById('foto-perfil-preview');
    const sobreTextarea = document.getElementById('sobre-mim-textarea');

    if (fotoPreview && usuario.fotoPerfil) {
        fotoPreview.src = usuario.fotoPerfil;
    }
    if (sobreTextarea && usuario.sobre) {
        sobreTextarea.value = usuario.sobre;
    }
}

// =======================================================================
// --- SEÇÃO DE GESTÃO DE PEDIDOS
// =======================================================================
/**
 * 1. CRIA O HTML DE UM CARD
 * Recebe um objeto de pedido e retorna a string de HTML para o card.
 * ÚNICA fonte da verdade para a aparência de um card.
 */
function criarCardPedidoHTML(pedido) {
    const dataFormatada = new Date(pedido.dataPedido).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const comprador = pedido.compradorInfo;
    return `
        <div class="pedido-vendedor-card" data-status="${pedido.status}">
            <div class="pedido-vendedor-header">
                <h4>Pedido #${pedido._id.slice(-6)}</h4>
                <span class="pedido-status">${pedido.status}</span>
            </div>
            <div class="pedido-vendedor-body">
                <p><strong>Data:</strong> ${dataFormatada}</p>
                <p><strong>Comprador:</strong> ${comprador?.nome || 'N/A'}</p>
                <p><strong>Contato:</strong> ${comprador?.telefone ? formatarTelefone(comprador.telefone) : 'N/A'}</p>
                <strong>Itens neste pedido:</strong>
                <ul>${pedido.produtos.map(p => `<li>${p.quantidade}x ${p.nome}</li>`).join('')}</ul>
                <p class="total-parcial"><strong>Seu total neste pedido: R$ ${pedido.total.toFixed(2).replace('.', ',')}</strong></p>
            </div>
            <div class="pedido-vendedor-acoes">
                <select class="select-status" data-pedido-id="${pedido._id}">
                    <option value="pendente" ${pedido.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="em andamento" ${pedido.status === 'em andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="enviado" ${pedido.status === 'enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="entregue" ${pedido.status === 'entregue' ? 'selected' : ''}>Entregue</option>
                    <option value="cancelado" ${pedido.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
                <button class="btn-salvar-status" data-pedido-id="${pedido._id}">Salvar Status</button>
            </div>
        </div>
    `;
}

/**
 * 2. APLICA FILTRO E RENDERIZA A LISTA COMPLETA
 * Pega o array 'todosOsPedidosDoVendedor', filtra e redesenha a tela inteira.
 * Usado após salvar status ou mudar de filtro.
 */
function aplicarFiltroEVenderizarVendedor() {
    const container = document.getElementById('pedidos-vendedor-container');
    if (!container) return;

    const pedidosFiltrados = filtroAtualVendedor === 'todos'
        ? todosOsPedidosDoVendedor
        : todosOsPedidosDoVendedor.filter(p => p.status === filtroAtualVendedor);

    if (pedidosFiltrados.length > 0) {
        container.innerHTML = pedidosFiltrados.map(criarCardPedidoHTML).join('');
    } else {
        if (todosOsPedidosDoVendedor.length > 0) {
            container.innerHTML = criarMensagemErro(`Nenhum pedido com o status "${filtroAtualVendedor}".`, 'info');
        } else {
            container.innerHTML = criarMensagemErro('Você ainda não recebeu nenhum pedido.', 'info');
        }
    }
    configurarAcoesVendedor();
}

/**
 * 3. BUSCA PEDIDOS DA API
 * Gerencia a chamada da API, paginação e a renderização inicial ou de "Carregar Mais".
 */
async function carregarPedidosParaVendedor(vendedorId, ehCarregarMais = false) {
    if (carregandoPedidos && ehCarregarMais) return;

    const container = document.getElementById('pedidos-vendedor-container');
    const btnCarregarMais = document.getElementById('btn-carregar-mais-pedidos');
    if (!container || !btnCarregarMais) return;

    abortController.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    carregandoPedidos = true;
    btnCarregarMais.textContent = 'Carregando...';
    btnCarregarMais.disabled = true;

    if (!ehCarregarMais) {
        container.innerHTML = criarLoader("Buscando pedidos...");
    }

    try {
        const data = await vendedorAPI.listarPedidos(vendedorId, paginaAtualVendedor, filtroAtualVendedor, signal);
        if (!data) return;

        if (!ehCarregarMais && data.pedidos.length === 0) {
            // Se o filtro for 'todos', significa que o vendedor REALMENTE não tem nenhum pedido.
            if (filtroAtualVendedor === 'todos') {
                container.innerHTML = criarMensagemErro('Você ainda não recebeu nenhum pedido.', 'info');
            }
            // Para qualquer outro filtro, a mensagem é específica.
            else {
                container.innerHTML = criarMensagemErro(`Nenhum pedido com o status "${filtroAtualVendedor}".`, 'info');
            }
        }
        // Se há pedidos para renderizar...
        else if (data.pedidos.length > 0) {
            const novosPedidosHtml = data.pedidos.map(criarCardPedidoHTML).join('');
            if (!ehCarregarMais) {
                container.innerHTML = novosPedidosHtml;
            } else {
                container.innerHTML += novosPedidosHtml;
            }
        }

        todosOsPedidosDoVendedor.push(...data.pedidos);
        totalPedidosNoBanco = data.totalPedidos;
        paginaAtualVendedor++;

        configurarAcoesVendedor();

        if (todosOsPedidosDoVendedor.length < totalPedidosNoBanco) {
            btnCarregarMais.classList.remove('hidden');
        } else {
            btnCarregarMais.classList.add('hidden');
        }

    } catch (error) {
        if (error.name !== 'AbortError') {
            mostrarErro(container, 'Não foi possível carregar seus pedidos', 'Ocorreu um erro no servidor.', () => resetarECarregarPedidos(vendedorId));
        }
    } finally {
        carregandoPedidos = false;
        btnCarregarMais.textContent = 'Carregar Mais';
        btnCarregarMais.disabled = false;
    }
}

/**
 * 4. RESETA E RECARREGA
 * Limpa o estado da paginação e inicia uma nova busca. Usado ao mudar de filtro.
 */
function resetarECarregarPedidos(vendedorId) {
    paginaAtualVendedor = 1;
    todosOsPedidosDoVendedor = [];
    filtroAtualVendedor = 'todos'; // Garante que o reset sempre volte para 'todos' ou o filtro desejado
    const filtroAtivo = document.querySelector('.filtro-btn.active');
    if (filtroAtivo) {
        filtroAtualVendedor = filtroAtivo.dataset.status;
    }
    carregarPedidosParaVendedor(vendedorId, false);
}

/**
 * 5. CONFIGURA AS AÇÕES DOS CARDS
 * Adiciona os listeners aos botões de "Salvar Status".
 */
function configurarAcoesVendedor() {
    document.querySelectorAll('.btn-salvar-status').forEach(button => {
        if (button.dataset.listenerAttached) return;
        button.dataset.listenerAttached = 'true';

        button.addEventListener('click', async (e) => {
            const pedidoId = e.target.dataset.pedidoId;
            const select = document.querySelector(`.select-status[data-pedido-id="${pedidoId}"]`);
            if (!select) return;

            const novoStatus = select.value;

            try {
                button.disabled = true;
                button.textContent = 'Salvando...';
                await vendedorAPI.atualizarStatusPedido(pedidoId, novoStatus);
                mostrarFeedback('Status do pedido atualizado com sucesso!', 'sucesso');

                const pedidoParaAtualizar = todosOsPedidosDoVendedor.find(p => p._id === pedidoId);
                if (pedidoParaAtualizar) {
                    pedidoParaAtualizar.status = novoStatus;
                }

                aplicarFiltroEVenderizarVendedor();

            } catch (error) {
                mostrarFeedback(`Erro ao atualizar status: ${error.message}`, 'erro');
            } finally {
                button.disabled = false;
                button.textContent = 'Salvar Status';
            }
        });
    });
}

// =======================================================================
// --- 4. PONTO DE ENTRADA PRINCIPAL (O "MAESTRO") ---
// =======================================================================
// Este evento espera o HTML estar 100% pronto para rodar o código.

document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!usuarioLogado) {
        mostrarFeedback('Por favor, faça login para acessar esta página', 'erro');
        setTimeout(() => window.location.href = '/index.html', 2000);
        return;
    }

    // --- Lógica de UI (mostrar/esconder seções) ---
    const isVendedorOuAdmin = usuarioLogado.cargo === 'vendedor' || usuarioLogado.cargo === 'administrador';
    document.getElementById('link-adm').style.display = usuarioLogado.cargo === 'administrador' ? 'inline-block' : 'none';
    document.getElementById('editor-perfil-vendedor').style.display = isVendedorOuAdmin ? 'block' : 'none';
    document.getElementById('secao-meus-produtos').style.display = isVendedorOuAdmin ? 'block' : 'none';
    document.getElementById('secao-gestao-pedidos').style.display = isVendedorOuAdmin ? 'block' : 'none';

    // --- Preenchimento de Dados e Carregamento Inicial ---
    preencherFormulario(usuarioLogado);
    if (isVendedorOuAdmin) {
        carregarDadosVendedor(usuarioLogado);
        carregarProdutosUsuario(usuarioLogado._id);
        carregarPedidosParaVendedor(usuarioLogado._id); // Carga inicial dos pedidos
    }

    // Configuração de TODOS os Eventos da Página

    // --- SUBMIT DO FORMULÁRIO DE DADOS PESSOAIS ---
    document.getElementById('form-perfil').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('enviar');
        try {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Atualizando...';

            const sexoSelecionado = document.querySelector('input[name="sexo"]:checked')?.value;
            const telefoneFormatado = formatarTelefone(document.getElementById('itel').value);

            if (!/^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(telefoneFormatado)) {
                throw new Error('Formato de telefone inválido.');
            }

            const formData = {
                userId: usuarioLogado._id,
                nome: document.getElementById('inome').value.trim(),
                sexo: sexoSelecionado,
                dataNascimento: document.getElementById('idat').value,
                telefone: telefoneFormatado.replace(/\D/g, ''),
                email: document.getElementById('iemail').value.trim(),
                senha: document.getElementById('isenha').value,
                nsenha: document.getElementById('insenha').value || null
            };

            if (!formData.nome || !formData.email || !formData.senha) {
                throw new Error('Nome, email e senha atual são obrigatórios');
            }

            const data = await perfilAPI.atualizar(formData);
            localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
            mostrarFeedback('Perfil atualizado com sucesso!', 'sucesso');
            document.getElementById('isenha').value = '';
            document.getElementById('insenha').value = '';
            preencherFormulario(data.usuario);
        } catch (error) {
            mostrarFeedback(error.message || 'Erro ao atualizar perfil', 'erro');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Atualizar Dados';
        }
    });

    // --- SUBMIT DO FORMULÁRIO DE VENDEDOR ---
    document.getElementById('form-perfil-vendedor').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSalvar = e.target.querySelector('button[type="submit"]');
        try {
            btnSalvar.disabled = true;
            btnSalvar.textContent = 'Salvando...';

            const formData = new FormData();
            formData.append('userId', usuarioLogado._id);
            formData.append('sobre', document.getElementById('sobre-mim-textarea').value);
            const fotoInput = document.getElementById('foto-perfil-input');
            if (fotoInput.files[0]) {
                formData.append('foto', fotoInput.files[0]);
            }

            const data = await vendedorAPI.atualizarVendedor(formData);

            if (data.data?.fotoPerfil) usuarioLogado.fotoPerfil = data.data.fotoPerfil;
            if (data.data?.sobre) usuarioLogado.sobre = data.data.sobre;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));

            mostrarFeedback('Perfil de vendedor atualizado com sucesso!', 'sucesso');
        } catch (error) {
            mostrarFeedback(`Erro ao atualizar: ${error.message}`, 'erro');
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar Perfil de Vendedor';
        }
    });

    // --- BOTÃO DE LOGOUT ---
    document.getElementById('btn-logout').addEventListener('click', () => {
        mostrarFeedback('Saindo da sua conta...', 'aviso');
        setTimeout(() => {
            localStorage.removeItem('usuarioLogado');
            window.location.href = '/index.html';
        }, 1500);
    });

    // --- LÓGICA DO MODAL DE EXCLUSÃO (A VERSÃO FINAL E CORRETA) ---
    const btnExcluir = document.getElementById('btn-excluir-conta');
    const modalExcluir = document.getElementById('modal-excluir-conta');
    const btnConfirmarExclusao = document.getElementById('confirmar-exclusao');
    const btnCancelarExclusao = document.getElementById('cancelar-exclusao');
    const inputSenhaExclusao = document.getElementById('senha-confirmacao');

    // Abre o modal
    if (btnExcluir) {
        btnExcluir.addEventListener('click', () => {
            if (modalExcluir) {
                inputSenhaExclusao.value = '';
                modalExcluir.classList.remove('hidden');
            }
        });
    }

    // Fecha o modal
    if (btnCancelarExclusao) {
        btnCancelarExclusao.addEventListener('click', () => {
            if (modalExcluir) {
                modalExcluir.classList.add('hidden');
            }
        });
    }

    // Confirma a exclusão
    if (btnConfirmarExclusao) {
        btnConfirmarExclusao.addEventListener('click', async () => {
            const senha = inputSenhaExclusao.value.trim();
            if (!senha) {
                mostrarFeedback('Digite sua senha para confirmar.', 'aviso');
                return;
            }
            try {
                await perfilAPI.excluir({ userId: usuarioLogado._id, senha: senha });
                if (modalExcluir) modalExcluir.classList.add('hidden');
                mostrarFeedback('Conta excluída com sucesso. Redirecionando...', 'sucesso');
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = '/index.html';
                }, 2500);
            } catch (error) {
                mostrarFeedback(error.message || 'Falha ao excluir conta.', 'erro');
            }
        });
    }

    // Filtros e Paginação da Gestão de Pedidos
    if (isVendedorOuAdmin) {
        carregarPedidosParaVendedor(usuarioLogado._id); // Carga inicial

        document.getElementById('btn-carregar-mais-pedidos').addEventListener('click', () => {
            carregarPedidosParaVendedor(usuarioLogado._id, true);
        });

        document.querySelectorAll('.filtro-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.filtro-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                filtroAtualVendedor = e.target.dataset.status;
                resetarECarregarPedidos(usuarioLogado._id);
            });
        });
        function resetarECarregarPedidos(vendedorId) {
            paginaAtualVendedor = 1;
            todosOsPedidosDoVendedor = [];
            carregarPedidosParaVendedor(vendedorId, false);
        }
    }
});