// assets/js/pages/perfil.js

// =========================== IMPORTAÇÕES ===============================
import { formatarTelefone } from '../modules/utils.js';
import { mostrarFeedback } from '../modules/ui.js';
import { perfilAPI } from '../modules/api.js';
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Carrega os dados do usuário
  const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

  if (!usuarioLogado) {
    mostrarFeedback('Por favor, faça login para acessar esta página', 'erro');
    setTimeout(() => window.location.href = '/index.html', 2000);
    return;
  }

  // Preenche o formulário com os dados do usuário
  preencherFormulario(usuarioLogado);

  // Configura o evento de submit do formulário
  document.getElementById('form-perfil').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSubmit = document.getElementById('enviar');
    const btnLogout = document.getElementById('btn-logout');

    try {
      // Desabilita os botões durante a requisição
      btnSubmit.disabled = true;
      btnLogout.disabled = true;
      btnSubmit.value = 'Atualizando...';

      const sexoSelecionado = document.querySelector('input[name="sexo"]:checked')?.value;

      // Obtém e formata o telefone antes de enviar
      const telefoneInput = document.getElementById('itel').value;
      const telefoneFormatado = formatarTelefone(telefoneInput);

      // Validação do telefone
      if (!/^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(telefoneFormatado)) {
        throw new Error('Formato de telefone inválido. Use (XX) XXXX-XXXX ou (XX) XXXXX-XXXX');
      }

      // Obtém os dados do formulário
      const formData = {
        userId: usuarioLogado._id,
        nome: document.getElementById('inome').value.trim(),
        sexo: sexoSelecionado,
        dataNascimento: document.getElementById('idat').value,
        telefone: telefoneFormatado.replace(/\D/g, ''), // Remove formatação para armazenar
        email: document.getElementById('iemail').value.trim(),
        senha: document.getElementById('isenha').value,
        nsenha: document.getElementById('insenha').value || null
      };

      // Validação básica
      if (!formData.nome || !formData.email) {
        throw new Error('Nome e email são obrigatórios');
      }

      if (formData.nsenha && !formData.senha) {
        throw new Error('Para alterar a senha, informe a senha atual');
      }

      // Envia para a API
      const data = await perfilAPI.atualizar(formData);

      // Atualiza os dados locais
      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      document.getElementById('saudacao').textContent = `Olá, ${data.usuario.nome}!`;

      mostrarFeedback('Perfil atualizado com sucesso!', 'sucesso');

      // Limpa os campos de senha
      document.getElementById('isenha').value = '';
      document.getElementById('insenha').value = '';

      // Atualiza o formulário com os novos dados
      preencherFormulario(data.usuario);

    } catch (error) {
      console.error('Erro na atualização:', error);
      mostrarFeedback(error.message || 'Erro ao atualizar perfil', 'erro');
      
      // Destaca campos com erro
      if (error.message.includes('telefone')) {
        document.getElementById('itel').classList.add('error-border');
      }

    } finally {
      btnSubmit.disabled = false;
      btnLogout.disabled = false;
      btnSubmit.value = 'Atualizar Perfil';
    }
  });

  // Configura o logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    mostrarFeedback('Saindo da sua conta...', 'aviso');
    setTimeout(() => {
      localStorage.removeItem('usuarioLogado');
      window.location.href = '/index.html';
    }, 1500);
  });

  // Configura a exclusão de conta
  configurarExclusaoConta();
});

function preencherFormulario(usuario) {
  document.getElementById('inome').value = usuario.nome || '';
  document.getElementById('idat').value = usuario.dataNascimento?.split('T')[0] || '';
  document.getElementById('itel').value = formatarTelefone(usuario.telefone || '');
  document.getElementById('iemail').value = usuario.email || '';

  // Normaliza o gênero
  const genero = (usuario.sexo === 'on' ? 
                 (usuario.genero || 'masculino') : 
                 usuario.sexo).toLowerCase().trim();

  document.getElementById('imas').checked = genero.includes('masc');
  document.getElementById('ifem').checked = genero.includes('fem');

  document.getElementById('saudacao').textContent = `Olá, ${usuario.nome}`;
}

function configurarExclusaoConta() {
  const btnExcluir = document.getElementById('btn-excluir-conta');

  btnExcluir?.addEventListener('click', () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!usuarioLogado) {
      mostrarFeedback('Faça login para acessar esta função', 'erro');
      return;
    }

    abrirModalExclusaoConta(async (senha) => {
    try {
      const data = await perfilAPI.excluir({
          userId: usuarioLogado._id,
          senha: senha
      });

      mostrarFeedback(data.message || 'Conta excluída com sucesso!', 'sucesso');

      setTimeout(() => {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '/index.html';
      }, 2000);

    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      mostrarFeedback(error.message || 'Falha ao excluir conta', 'erro');
    }
  });
  });
}

function abrirModalExclusaoConta(callback) {
  const modal = document.getElementById('modal-excluir-conta');
  const confirmarBtn = document.getElementById('confirmar-exclusao');
  const cancelarBtn = document.getElementById('cancelar-exclusao');
  const inputSenha = document.getElementById('senha-confirmacao');

  inputSenha.value = ''; // limpa o campo sempre que abrir
  modal.style.display = 'flex';

  confirmarBtn.onclick = () => {
    const senha = inputSenha.value.trim();
    if (!senha) {
      mostrarFeedback('Digite sua senha para continuar', 'aviso');
      return;
    }

    modal.style.display = 'none';
    callback(senha); // envia a senha para quem chamou
  };

  cancelarBtn.onclick = () => {
    modal.style.display = 'none';
    mostrarFeedback('Exclusão de conta cancelada', 'aviso');
  };
}

// Formatação dinâmica do telefone
const campoTelefone = document.getElementById('itel');
if (campoTelefone) {
    campoTelefone.addEventListener('input', (e) => {
        // Pega o valor atual do campo
        const valorAtual = e.target.value;
        
        // Usa a função importada para formatar o valor
        const valorFormatado = formatarTelefone(valorAtual);
        
        // Atualiza o valor do campo com o resultado formatado
        e.target.value = valorFormatado;
    });
}

configurarExclusaoConta();