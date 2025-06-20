// Código garantido para auth.js
const formLogin = document.getElementById('form-login');

if (formLogin) {
  formLogin.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('[DEBUG] Formulário submetido');
    
    const btn = formLogin.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Processando...';

    try {
      // 1. Captura dos dados
      const formData = {
        email: document.getElementById('iemail').value,
        senha: document.getElementById('isenha').value
      };
      console.log('[DEBUG] Dados:', formData);

      // 2. Envio para API
      const response = await fetch('https://ecomarket-samavi.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      // 3. Processamento da resposta
      const result = await response.json();
      console.log('[DEBUG] Resposta:', result);

      if (result.success) {
        // 4. Armazenamento e redirecionamento
        localStorage.setItem('usuarioLogado', JSON.stringify(result.usuario));
        window.location.href = result.redirect || '/paginas/home.html';
      } else {
        alert(result.message || 'Erro no login');
      }
    } catch (error) {
      console.error('[ERRO]', error);
      alert('Falha na conexão');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
} else {
  console.error('[ERRO] Formulário não encontrado');
}
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