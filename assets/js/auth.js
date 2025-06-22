document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnLogin = document.getElementById('btn-login'); // Seleção direta por ID
    if (!btnLogin) {
      console.error('Botão de login não encontrado!');
      return;
    }

    try {
      btnLogin.disabled = true;
      btnLogin.value = 'Autenticando...';

      const email = document.getElementById('iemail').value.trim();
      const senha = document.getElementById('isenha').value;

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro no login');
      }

      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      window.location.href = data.redirect || '/paginas/home.html';

    } catch (error) {
      console.error('Erro no login:', error);
      alert(error.message || 'Falha na autenticação');
    } finally {
      if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.value = 'Entrar';
      }
    }
  });
});

// Registro - Adaptado para seu formulário
document.getElementById('form-cadastro')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const usuario = {
    nome: document.getElementById('inome').value,
    sexo: document.querySelector('input[name="sexo"]:checked')?.value || '',
    dataNascimento: document.getElementById('idat').value,
    telefone: document.getElementById('itel').value,
    email: document.getElementById('iemail').value,
    senha: document.getElementById('isenha')?.value || ''  // Adicione este campo ao seu form
  };

  try {
    const response = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuario),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      alert('Cadastro realizado com sucesso!');
      window.location.href = '/paginas/home.html';  // Redireciona direto para a home
    } else {
      alert(data.message || 'Erro no cadastro');
    }
  } catch (error) {
    alert('Erro ao conectar com o servidor');
    console.error(error);
  }
});