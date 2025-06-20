// Login
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('iemail').value,
        senha: document.getElementById('isenha').value
      })
    });

    const data = await response.json();
    console.log("Resposta da API:", data); // Para debug

    if (data.success) {
      // Armazena TODOS os dados do usuário (incluindo _id)
      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      
      // Redireciona conforme a API sugeriu
      window.location.href = data.redirect || 'index.html';
    } else {
      alert(`${data.message}\n${data.suggestion || ''}`);
    }
  } catch (error) {
    console.error("Erro no login:", error);
    alert("Erro ao conectar com o servidor");
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
    senha: document.getElementById('isenha')?.value || ''
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
      window.location.href = '/paginas/conta.html';  // Redireciona direto para a conta
    } else {
      alert(data.message || 'Erro no cadastro');
    }
  } catch (error) {
    alert('Erro ao conectar com o servidor');
    console.error(error);
  }
});