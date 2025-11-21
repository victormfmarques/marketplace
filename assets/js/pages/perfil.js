
// --- 1. IMPORTAÇÕES ---
// Todas as dependências que o arquivo precisa.
import { formatarTelefone } from '../modules/utils.js';
import { criarMensagemErro, mostrarFeedback, criarLoader, mostrarErro } from '../modules/ui.js';
import { perfilAPI, produtosAPI, vendedorAPI } from '../modules/api.js';

// --- 2. FUNÇÕES AUXILIARES ---
// Todas as funções que fazem o "trabalho sujo" ficam aqui fora, no escopo do módulo.
// Elas são como ferramentas em uma caixa, prontas para serem usadas pelo "maestro".

/**
 * Carrega e exibe os produtos do usuário logado na seção correspondente.
 */
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
            const foto = prod.fotos?.length
                ? (prod.fotos[0].startsWith('http' ) ? prod.fotos[0] : `https://res.cloudinary.com/ddfacpcm5/image/upload/${prod.fotos[0]}` )
                : '/assets/img/placeholder.png';

            return `
              <div class="produto-card">
                <a href="detalhes-produto.html?id=${prod._id}">
                  <img src="${foto}" alt="${prod.nome}" />
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
 * Preenche o formulário de dados pessoais com as informações do usuário.
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

// --- 3. PONTO DE ENTRADA PRINCIPAL (O "MAESTRO") ---
// Este evento espera o HTML estar 100% pronto para rodar o código.

document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    // 1. Validação de Segurança: Se não há usuário, expulsa da página.
    if (!usuarioLogado) {
        mostrarFeedback('Por favor, faça login para acessar esta página', 'erro');
        setTimeout(() => window.location.href = '/index.html', 2000);
        return;
    }

    // 2. Lógica de UI (mostrar/esconder elementos com base no cargo)
    const linkAdm = document.getElementById('link-adm');
    if (linkAdm) {
        linkAdm.style.display = usuarioLogado.cargo === 'administrador' ? 'inline-block' : 'none';
    }

    const editorPerfilVendedor = document.getElementById('editor-perfil-vendedor');
    const secaoMeusProdutos = document.getElementById('secao-meus-produtos');
    const isVendedorOuAdmin = usuarioLogado.cargo === 'vendedor' || usuarioLogado.cargo === 'administrador';

    if (editorPerfilVendedor) {
        editorPerfilVendedor.style.display = isVendedorOuAdmin ? 'block' : 'none';
    }
    if (secaoMeusProdutos) {
        secaoMeusProdutos.style.display = isVendedorOuAdmin ? 'block' : 'none';
    }

    // 3. Preenchimento de Dados
    preencherFormulario(usuarioLogado);
    if (isVendedorOuAdmin) {
        carregarDadosVendedor(usuarioLogado);
        carregarProdutosUsuario();
    }

    // 4. Configuração de TODOS os Eventos da Página

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
});