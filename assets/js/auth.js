document.getElementById('form-login').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  try {
    const response = await fetch('https://ecomarket-samavi.vercel.app/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: document.getElementById('iemail').value,
        senha: document.getElementById('isenha').value
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      window.location.href = data.redirect || '/paginas/home.html';
    } else {
      alert(data.message || 'Login falhou');
    }
  } catch (error) {
    console.error('Erro completo:', error);
    alert('Erro ao conectar com o servidor. Verifique o console para detalhes.');
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