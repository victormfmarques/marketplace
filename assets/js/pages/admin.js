// js/pages/admin.js

// =========================== IMPORTAÇÕES ===============================
import { adminAPI } from '../modules/api.js';
import { mostrarFeedback, criarLoader } from '../modules/ui.js';
// =======================================================================

let todosOsUsuarios = [];
let sortDirection = {}; // Objeto para guardar a direção da ordenação de cada coluna

// --- PONTO DE ENTRADA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    
    // A guarda de rota no HTML já protegeu a página, mas é bom ter certeza.
    if (!usuarioLogado || usuarioLogado.cargo !== 'administrador') {
        return;
    }

    // Carrega os usuários na tela
    carregarUsuarios(usuarioLogado._id);

    // Configura os eventos do modal de edição UMA ÚNICA VEZ
    configurarFormularioEdicao();
});

// --- FUNÇÕES DE LÓGICA ---

async function carregarUsuarios(adminId) {
    const container = document.getElementById('tabela-container');

    try {
        container.innerHTML = criarLoader("Carregando usuários...");
        const result = await adminAPI.listarUsuarios(adminId);
        todosOsUsuarios = result.data;
        renderizarTabelaUsuarios(result.data, container);
    } catch (error) {
        mostrarFeedback(error.message, 'erro');
    }
}

function renderizarTabelaUsuarios(usuarios, container) {
    const tabelaHTML = `
        <table>
            <thead>
                <tr>
                    <th data-sort="nome">Nome ↕️</th>
                    <th data-sort="email">Email ↕️</th>
                    <th data-sort="cargo">Cargo ↕️</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${usuarios.map(user => {
                    // --- LÓGICA DE DECISÃO PARA A CÉLULA DE AÇÕES ---
                    let acoesHTML = ''; // Começa vazia
                    if (user.cargo === 'administrador') {
                        acoesHTML = '<span>N/A</span>'; // Se for admin, não há ações
                    } else {
                        // Se não for admin, cria o botão normalmente
                        acoesHTML = `
                            <button class="btn-cargo" data-id="${user._id}" data-cargo-atual="${user.cargo}">
                                ${user.cargo === 'vendedor' ? 'Rebaixar' : 'Promover'}
                            </button>
                            <button class="btn-editar-user" data-id="${user._id}">Editar</button>
                            <button class="btn-excluir-user" data-id="${user._id}">Excluir</button>
                        `;
                    }
                     // --- FIM DA LÓGICA ---

                    return `
                        <tr>
                            <td>${user.nome}</td>
                            <td>${user.email}</td>
                            <td>${user.cargo}</td>
                            <td>${acoesHTML}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = tabelaHTML; // Adiciona a tabela ao corpo da página

    configurarBotoesAcao(); // Garante que os botões de ação funcionem
    configurarOrdenacaoTabela(usuarios); // Configura a ordenação para a tabela recém-desenhada
    configurarPesquisa();
}

function configurarBotoesAcao() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    // SELETOR ESPECÍFICO para o botão de cargo
    document.querySelectorAll('.btn-cargo').forEach(button => {
        button.addEventListener('click', async (e) => {
            const targetUserId = e.target.dataset.id;
            const cargoAtual = e.target.dataset.cargoAtual;
            const novoCargo = cargoAtual === 'vendedor' ? 'comprador' : 'vendedor';

            const confirmado = await confirmarComModal('Mudar Cargo', `Mudar cargo para "${novoCargo}"?`);
            if (!confirmado) return;

            try {
                button.disabled = true;
                button.textContent = 'Alterando...';
                await adminAPI.mudarCargo(usuarioLogado._id, targetUserId, novoCargo);
                mostrarFeedback('Cargo atualizado!', 'sucesso');
                carregarUsuarios(usuarioLogado._id);
            } catch (error) {
                mostrarFeedback(error.message, 'erro');
                button.disabled = false;
                button.textContent = cargoAtual === 'vendedor' ? 'Rebaixar para Comprador' : 'Promover para Vendedor';
            }
        });
    });
    
    // SELETOR ESPECÍFICO para o botão de editar
    document.querySelectorAll('.btn-editar-user').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetUserId = e.target.dataset.id;
            const linha = e.target.closest('tr');
            const nome = linha.cells[0].textContent;
            const email = linha.cells[1].textContent;
            abrirModalEdicao({ _id: targetUserId, nome, email });
        });
    });

    // SELETOR ESPECÍFICO para o botão de excluir
    document.querySelectorAll('.btn-excluir-user').forEach(button => {
        button.addEventListener('click', async (e) => {
            const targetUserId = e.target.dataset.id;
            const confirmado = await confirmarComModal('Excluir Usuário', 'ATENÇÃO: Ação irreversível. Excluir este usuário?');
            if (!confirmado) return;

            try {
                button.disabled = true;
                button.textContent = 'Excluindo...';
                await adminAPI.excluirUsuario(usuarioLogado._id, targetUserId);
                mostrarFeedback('Usuário excluído!', 'sucesso');
                carregarUsuarios(usuarioLogado._id);
            } catch (error) {
                // ... (código de erro)
            }
        });
    });
}

function configurarOrdenacaoTabela(usuarios) {
    document.querySelectorAll('th[data-sort]').forEach(headerCell => {
        headerCell.style.cursor = 'pointer'; // Muda o cursor para indicar que é clicável
        
        headerCell.addEventListener('click', () => {
            const sortKey = headerCell.dataset.sort;
            
            // Alterna a direção: ascendente -> descendente -> original
            if (!sortDirection[sortKey]) {
                sortDirection[sortKey] = 'asc';
            } else if (sortDirection[sortKey] === 'asc') {
                sortDirection[sortKey] = 'desc';
            } else {
                delete sortDirection[sortKey]; // Remove a ordenação
            }

            // Limpa a direção das outras colunas para ordenar uma de cada vez
            Object.keys(sortDirection).forEach(key => {
                if (key !== sortKey) delete sortDirection[key];
            });

            let usuariosOrdenados = [...usuarios]; // Cria uma cópia para não modificar a original

            if (sortDirection[sortKey]) {
                usuariosOrdenados.sort((a, b) => {
                    const valA = a[sortKey] || '';
                    const valB = b[sortKey] || '';
                    
                    if (valA < valB) return sortDirection[sortKey] === 'asc' ? -1 : 1;
                    if (valA > valB) return sortDirection[sortKey] === 'asc' ? 1 : -1;
                    return 0;
                });
            }
            
            // Redesenha a tabela com os usuários ordenados
            const container = document.getElementById('tabela-container');
            renderizarTabelaUsuarios(usuariosOrdenados, container);
        });
    });
}

function configurarPesquisa() {
    const searchInput = document.getElementById('admin-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const termo = searchInput.value.trim().toLowerCase();
        const container = document.getElementById('tabela-container');

        // Filtra a lista ORIGINAL de usuários
        const usuariosFiltrados = todosOsUsuarios.filter(user => {
            const nome = user.nome || '';
            const email = user.email || '';
            return nome.toLowerCase().includes(termo) || email.toLowerCase().includes(termo);
        });

        // Redesenha a tabela APENAS com os usuários filtrados
        renderizarTabelaUsuarios(usuariosFiltrados, container);
    });
}
    
function confirmarComModal(titulo, texto) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirmacao');
        const tituloEl = document.getElementById('modal-titulo');
        const textoEl = document.getElementById('modal-texto');
        const btnConfirmar = document.getElementById('btn-confirmar-modal');
        const btnCancelar = document.getElementById('btn-cancelar-modal');

        tituloEl.textContent = titulo;
        textoEl.textContent = texto;
        modal.style.display = 'flex';

        btnConfirmar.onclick = () => {
            modal.style.display = 'none';
            resolve(true); // Usuário confirmou
        };

        btnCancelar.onclick = () => {
            modal.style.display = 'none';
            resolve(false); // Usuário cancelou
        };
    });
}

function abrirModalEdicao(user) {
    const modal = document.getElementById('modal-edicao');
    
    // Preenche o formulário com os dados do usuário
    document.getElementById('edit-userId').value = user._id;
    document.getElementById('edit-nome').value = user.nome;
    document.getElementById('edit-email').value = user.email;

    modal.style.display = 'flex';
}

function configurarFormularioEdicao() {
    const form = document.getElementById('form-edicao');
    const modal = document.getElementById('modal-edicao');
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    // Evento para fechar o modal ao clicar em "Cancelar"
    document.getElementById('btn-cancelar-edicao').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Evento para salvar as alterações
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSalvar = form.querySelector('button[type="submit"]');

        const targetUserId = document.getElementById('edit-userId').value;
        const novosDados = {
            nome: document.getElementById('edit-nome').value,
            email: document.getElementById('edit-email').value
        };

        try {
            btnSalvar.disabled = true;
            btnSalvar.textContent = 'Salvando...';

            await adminAPI.atualizarUsuario(usuarioLogado._id, targetUserId, novosDados);
            
            modal.style.display = 'none';
            mostrarFeedback('Usuário atualizado com sucesso!', 'sucesso');
            carregarUsuarios(usuarioLogado._id); // Recarrega a tabela

        } catch (error) {
            mostrarFeedback(error.message, 'erro');
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar Alterações';
        }
    });
}