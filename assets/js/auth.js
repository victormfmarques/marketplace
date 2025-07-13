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

    // Requisição com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('/api/perfil/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Tratamento da resposta
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro no servidor durante o login');
    }

    // Armazenamento seguro do usuário
    localStorage.setItem('usuarioLogado', JSON.stringify({
      ...data.usuario,
      authTime: new Date().toISOString()
    }));

    mostrarFeedback('Login realizado com sucesso!', 'sucesso');
    
    // Redirecionamento seguro após o feedback
    setTimeout(() => {
      window.location.href = data.redirect || '/paginas/home.html';
    }, 2000);

  } catch (error) {
    console.error('Erro no login:', error);
    mostrarFeedback(error.message || 'Falha na autenticação. Tente novamente.', 'erro');

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

  const btnCadastro = document.querySelector('#form-cadastro button[type="submit"]');
  const senhaInput = document.getElementById('isenha');
  const confirmacaoSenhaInput = document.getElementById('iconfirmasenha');

  try {
    // Estado de loading
    if (btnCadastro) {
      btnCadastro.disabled = true;
      btnCadastro.textContent = 'Registrando...';
    }

    // Validação dos dados
    const usuario = {
      nome: document.getElementById('inome')?.value.trim(),
      sexo: document.querySelector('input[name="sexo"]:checked')?.value || '',
      dataNascimento: document.getElementById('idat')?.value,
      telefone: document.getElementById('itel')?.value.replace(/\D/g, ''),
      email: document.getElementById('iemail')?.value.trim(),
      senha: senhaInput?.value
    };

    // Validações detalhadas
    if (!usuario.nome) {
      throw new Error('O nome completo é obrigatório');
    }

    if (!usuario.sexo) {
      throw new Error('Selecione seu sexo');
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

    // Requisição
    const response = await fetch('/api/perfil/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuario)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao processar cadastro');
    }

    // Armazenamento e redirecionamento
    localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
    mostrarFeedback('Cadastro realizado com sucesso!', 'sucesso');
    
    // Redirecionamento após o feedback
    setTimeout(() => {
      window.location.href = data.redirect || '/paginas/home.html';
    }, 2000);

  } catch (error) {
    console.error('Erro no cadastro:', error);
    mostrarFeedback(error.message, 'erro');
  } finally {
    if (btnCadastro) {
      btnCadastro.disabled = false;
      btnCadastro.textContent = 'Cadastrar';
    }
  }
});

// Formatação dinâmica do telefone
document.getElementById('itel')?.addEventListener('input', function(e) {
  const input = e.target;
  let rawValue = input.value.replace(/\D/g, ''); // só números

  // Armazena a posição antiga do cursor relativa ao fim do input
  const oldCursorPos = input.selectionStart;
  const oldLength = input.value.length;

  // Aplica a formatação no rawValue
  let formattedValue = '';
  if (rawValue.length > 0) {
    formattedValue = `(${rawValue.substring(0, 2)}) `;
    if (rawValue.length <= 6) {
      formattedValue += rawValue.substring(2);
    } else if (rawValue.length <= 10) {
      formattedValue += rawValue.substring(2, rawValue.length - 4) + '-' + rawValue.substring(rawValue.length - 4);
    } else {
      formattedValue += rawValue.substring(2, 7) + '-' + rawValue.substring(7, 11);
    }
  }

  // Atualiza o valor no input
  input.value = formattedValue;

  // Calcula a nova posição do cursor
  const newLength = formattedValue.length;
  const diffLength = newLength - oldLength;

  let newCursorPos = oldCursorPos + diffLength;

  // Corrige cursor para não passar do tamanho do texto
  if (newCursorPos > newLength) newCursorPos = newLength;
  if (newCursorPos < 0) newCursorPos = 0;

  // Ajusta o cursor para a nova posição
  input.setSelectionRange(newCursorPos, newCursorPos);
});