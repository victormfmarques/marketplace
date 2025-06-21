// Login
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('iemail').value;  // ID atualizado para match com seu form
  const senha = document.getElementById('isenha').value;  // Adicione este campo ao seu form de login

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      window.location.href = '/paginas/home.html';  // Redireciona para a conta
    } else {
      alert(data.message || 'Erro no login');
    }
  } catch (error) {
    alert('Erro ao conectar com o servidor');
    console.error(error);
  }
});

// Registro - Adaptado para seu formulário
document.querySelector('.content')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
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
      body: JSON.stringify(formData),
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