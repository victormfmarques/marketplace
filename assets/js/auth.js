// Login
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
    window.location.href = '/index.html';  // Redireciona para o perfil
  } else {
    alert(data.message);
  }
});

// Registro
document.getElementById('form-registro')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  const response = await fetch('/api/cadastro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha }),
  });

  const data = await response.json();
  alert(data.message);
  if (response.ok) {
    window.location.href = '/paginas/login.html';  // Redireciona para o login
  }
});