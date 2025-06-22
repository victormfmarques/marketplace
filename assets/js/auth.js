document.addEventListener('DOMContentLoaded', () => {
  // ========== LOGIN ==========
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnLogin = document.getElementById('btn-login');
    const emailInput = document.getElementById('iemail');
    const senhaInput = document.getElementById('isenha');

    if (!btnLogin || !emailInput || !senhaInput) {
      console.error('Elementos do formulário não encontrados!');
      return;
    }

    try {
      // Estado de loading
      btnLogin.disabled = true;
      btnLogin.value = 'Autenticando...';

      // Validação básica
      const email = emailInput.value.trim();
      const senha = senhaInput.value;
      
      if (!email || !senha) {
        throw new Error('Por favor, preencha todos os campos');
      }

      // Requisição com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const response = await fetch('/api/login', {
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
        authTime: new Date().toISOString() // Timestamp de autenticação
      }));

      // Redirecionamento seguro
      window.location.href = data.redirect || '/paginas/home.html';

    } catch (error) {
      console.error('Erro no login:', error);
      alert(error.message || 'Falha na autenticação. Tente novamente.');
      
      // Foca no campo problemático
      if (error.message.includes('email')) {
        emailInput.focus();
      } else if (error.message.includes('senha')) {
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
        senha: document.getElementById('isenha')?.value
      };

      // Validação básica
      if (!usuario.email || !usuario.senha) {
        throw new Error('Email e senha são obrigatórios');
      }

      if (usuario.senha.length < 8) {
        throw new Error('A senha deve ter pelo menos 8 caracteres');
      }

      // Requisição
      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro no cadastro');
      }

      // Armazenamento e redirecionamento
      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      alert('Cadastro realizado com sucesso!');
      window.location.href = data.redirect || '/paginas/home.html';

    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert(error.message || 'Falha no cadastro. Verifique os dados e tente novamente.');
    } finally {
      if (btnCadastro) {
        btnCadastro.disabled = false;
        btnCadastro.textContent = 'Cadastrar';
      }
    }
  });
});