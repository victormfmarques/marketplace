// assets/js/pages/auth.js

// =========================== IMPORTAÇÕES ===============================
import { formatarTelefone } from '../modules/utils.js';
import { mostrarFeedback } from '../modules/ui.js';
import { authAPI } from '../modules/api.js';
// =======================================================================

// ========== LOGIN ==========
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btnLogin = document.getElementById('btn-login');
  const emailInput = document.getElementById('iemail');
  const senhaInput = document.getElementById('isenha');

  if (!btnLogin || !emailInput || !senhaInput) {
    mostrarFeedback('Elementos do formulário não encontrados!', 'erro');
    return;
  }

  try {
    // Estado de loading
    btnLogin.disabled = true;
    btnLogin.value = 'Autenticando...';

    // Validação básica
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!email) {
      throw new Error('Por favor, informe seu email');
    }

    if (!senha) {
      throw new Error('Por favor, informe sua senha');
    }

    const data = await authAPI.login(email, senha);

    // Armazenamento seguro do usuário
    localStorage.setItem('usuarioLogado', JSON.stringify({
      ...data.usuario,
      authTime: new Date().toISOString()
    }));
    localStorage.setItem('token', data.token);

    mostrarFeedback('Login realizado com sucesso!', 'sucesso');
    
    // Redirecionamento seguro após o feedback
    setTimeout(() => {
      window.location.href = data.redirect || '/index.html';
    }, 2000);

  } catch (error) {
    console.error('Erro no login:', error);
    
    // Mensagens mais amigáveis para erros específicos
    if (error.message.includes('Timeout')) {
      mostrarFeedback('A conexão está lenta. Tente novamente.', 'erro');
    } else if (error.name === 'TypeError') {
      mostrarFeedback('Erro de conexão. Verifique sua internet.', 'erro');
    } else {
      mostrarFeedback(error.message || 'Falha na autenticação. Tente novamente.', 'erro');
    }

    // Foca no campo problemático
    if (error.message.toLowerCase().includes('email')) {
      emailInput.focus();
    } else if (error.message.toLowerCase().includes('senha')) {
      senhaInput.focus();
    }
  } finally {
    if (btnLogin) {
      btnLogin.disabled = false;
      btnLogin.value = 'Entrar';
    }
  }
});

// ========== CADASTRO ==========
document.getElementById('form-cadastro')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btnCadastro = document.querySelector('#form-cadastro input[type="submit"]');
  const senhaInput = document.getElementById('isenha');
  const confirmacaoSenhaInput = document.getElementById('iconfirmasenha');

  try {
    // Estado de loading
    if (btnCadastro) {
      btnCadastro.disabled = true;
      btnCadastro.value = 'Registrando...';
    }

    // Validação dos dados
    const usuario = {
      nome: document.getElementById('inome')?.value.trim(),
      telefone: document.getElementById('itel')?.value.replace(/\D/g, ''),
      email: document.getElementById('iemail')?.value.trim(),
      senha: senhaInput?.value
    };

    // Validações detalhadas
    if (!usuario.nome) {
      throw new Error('O nome completo é obrigatório');
    }

    if (!usuario.email) {
      throw new Error('O email é obrigatório');
    } else if (!usuario.email.includes('@')) {
      throw new Error('Informe um email válido');
    }

    if (!usuario.senha) {
      throw new Error('A senha é obrigatória');
    } else if (usuario.senha.length < 8) {
      throw new Error('A senha deve ter pelo menos 8 caracteres');
    }

    // Validação da confirmação de senha
    const confirmacaoSenha = confirmacaoSenhaInput?.value;
    if (usuario.senha !== confirmacaoSenha) {
      senhaInput.classList.add('error-border');
      confirmacaoSenhaInput.classList.add('error-border');
      throw new Error('As senhas não coincidem');
    }

    senhaInput.classList.remove('error-border');
    confirmacaoSenhaInput.classList.remove('error-border');

    const data = await authAPI.cadastrar(usuario);

    // Armazenamento e redirecionamento
    localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
    mostrarFeedback('Cadastro realizado com sucesso!', 'sucesso');
    
    // Redirecionamento após o feedback
    setTimeout(() => {
      window.location.href = data.redirect || '/index.html';
    }, 2000);

  } catch (error) {
    console.error('Erro no cadastro:', error);
    mostrarFeedback(error.message, 'erro');
  } finally {
    if (btnCadastro) {
      btnCadastro.disabled = false;
      btnCadastro.value = 'Cadastrar';
    }
  }
});

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

// Se já estiver logado, manda pra home direto
document.addEventListener("DOMContentLoaded", () => {
  const usuario = localStorage.getItem("usuarioLogado");
  if (usuario) {
    window.location.href = "/index.html";
  }
});