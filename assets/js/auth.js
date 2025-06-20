// Versão robusta e testada para auth.js
document.getElementById('form-login').addEventListener('submit', async function(e) {
  e.preventDefault();
  console.log('Submit do formulário detectado'); // Debug 1
  
  const btnSubmit = e.target.querySelector('[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.value = 'Autenticando...';

  try {
    console.log('Enviando requisição...'); // Debug 2
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('iemail').value,
        senha: document.getElementById('isenha').value
      })
    });

    const data = await response.json();
    console.log('Resposta recebida:', data); // Debug 3

    if (data.success) {
      console.log('Login válido, armazenando dados...'); // Debug 4
      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      
      console.log('Redirecionando para:', data.redirect); // Debug 5
      window.location.href = data.redirect;
    } else {
      alert(data.message || 'Erro no login');
    }
  } catch (error) {
    console.error('Erro completo:', error);
    alert('Falha na conexão com o servidor');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.value = 'Entrar';
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