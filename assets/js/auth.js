// Login - Versão melhorada com mais validações
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // 1. Validação básica dos campos
  const email = document.getElementById('iemail')?.value.trim();
  const senha = document.getElementById('isenha')?.value;
  
  if (!email || !senha) {
    alert('Por favor, preencha todos os campos');
    return;
  }

  try {
    // 2. Adicionando loading state (melhora UX)
    const btnLogin = e.target.querySelector('button[type="submit"]');
    btnLogin.disabled = true;
    btnLogin.textContent = 'Autenticando...';

    // 3. Requisição com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // 4. Tratamento mais detalhado da resposta
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro no servidor');
    }

    // 5. Armazenamento seguro do usuário
    localStorage.setItem('usuarioLogado', JSON.stringify({
      ...data.usuario,
      timestamp: Date.now() // Para expiração de sessão
    }));

    // 6. Redirecionamento seguro
    window.location.href = data.redirect || '/paginas/home.html';

  } catch (error) {
    console.error('Erro no login:', error);
    alert(error.message || 'Falha na autenticação');
  } finally {
    // 7. Restaurar estado do botão
    const btnLogin = document.querySelector('#form-login button[type="submit"]');
    if (btnLogin) {
      btnLogin.disabled = false;
      btnLogin.textContent = 'Entrar';
    }
  }
});

// Registro - Versão melhorada
document.getElementById('form-cadastro')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // 1. Coleta de dados com validação
  const formData = {
    nome: document.getElementById('inome')?.value.trim(),
    sexo: document.querySelector('input[name="sexo"]:checked')?.value || '',
    dataNascimento: document.getElementById('idat')?.value,
    telefone: document.getElementById('itel')?.value.replace(/\D/g, ''),
    email: document.getElementById('iemail')?.value.trim(),
    senha: document.getElementById('isenha')?.value
  };

  // 2. Validação básica
  if (!formData.email || !formData.senha) {
    alert('Email e senha são obrigatórios');
    return;
  }

  try {
    // 3. Estado de loading
    const btnCadastro = e.target.querySelector('button[type="submit"]');
    btnCadastro.disabled = true;
    btnCadastro.textContent = 'Registrando...';

    const response = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro no cadastro');
    }

    // 4. Login automático após cadastro
    localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
    alert('Cadastro realizado com sucesso!');
    window.location.href = data.redirect || '/paginas/home.html';

  } catch (error) {
    console.error('Erro no cadastro:', error);
    alert(error.message || 'Falha no cadastro');
  } finally {
    const btnCadastro = document.querySelector('#form-cadastro button[type="submit"]');
    if (btnCadastro) {
      btnCadastro.disabled = false;
      btnCadastro.textContent = 'Cadastrar';
    }
  }
});