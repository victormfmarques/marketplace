// Versão robusta do auth.js
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('Evento de submit capturado'); // Debug 1
  
  try {
    const response = await fetch('https://ecomarket-samnah.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('iemail').value,
        senha: document.getElementById('isenha').value
      })
    });

    const data = await response.json();
    console.log('Resposta da API:', data); // Debug 2

    if (data.success && data.redirect) {
      console.log('Redirecionando para:', data.redirect); // Debug 3
      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      window.location.assign(data.redirect); // Usamos assign() em vez de href
    } else {
      alert(data.message || 'Login falhou');
    }
  } catch (error) {
    console.error('Erro completo:', error);
    alert('Falha na conexão com o servidor');
  }
});

// // Registro - Adaptado para seu formulário
// document.querySelector('.content')?.addEventListener('submit', async (e) => {
//   e.preventDefault();
  
//   const formData = {
//     nome: document.getElementById('inome').value,
//     sexo: document.querySelector('input[name="sexo"]:checked')?.value || '',
//     dataNascimento: document.getElementById('idat').value,
//     telefone: document.getElementById('itel').value,
//     email: document.getElementById('iemail').value,
//     senha: document.getElementById('isenha')?.value || ''
//   };

//   try {
//     const response = await fetch('/api/cadastro', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(formData),
//     });

//     const data = await response.json();
//     if (response.ok) {
//       localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
//       alert('Cadastro realizado com sucesso!');
//       window.location.href = '/paginas/conta.html';  // Redireciona direto para a conta
//     } else {
//       alert(data.message || 'Erro no cadastro');
//     }
//   } catch (error) {
//     alert('Erro ao conectar com o servidor');
//     console.error(error);
//   }
// });