document.addEventListener('DOMContentLoaded', function() {
  const formLogin = document.getElementById('form-login');
  
  if (formLogin) {
    formLogin.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('[DEBUG] Formulário submetido');

      // Encontre o botão corretamente pelo seletor CSS
      const btn = formLogin.querySelector('input[type="submit"], button[type="submit"]');
      
      if (!btn) {
        console.error('[ERRO] Botão de submit não encontrado');
        return;
      }

      const originalValue = btn.value || btn.textContent;
      btn.disabled = true;
      
      // Atualize o texto do botão de forma segura
      if ('value' in btn) {
        btn.value = 'Autenticando...';
      } else {
        btn.textContent = 'Autenticando...';
      }

      try {
        const formData = {
          email: document.getElementById('iemail').value,
          senha: document.getElementById('isenha').value
        };
        console.log('[DEBUG] Dados:', formData);

        const response = await fetch('https://ecomarket-samavi.vercel.app/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        console.log('[DEBUG] Resposta:', result);

        if (result.success) {
          localStorage.setItem('usuarioLogado', JSON.stringify(result.usuario));
          window.location.href = result.redirect || '/paginas/home.html';
        } else {
          alert(result.message || 'Erro no login');
        }
      } catch (error) {
        console.error('[ERRO]', error);
        alert('Falha na conexão com o servidor');
      } finally {
        btn.disabled = false;
        if ('value' in btn) {
          btn.value = originalValue;
        } else {
          btn.textContent = originalValue;
        }
      }
    });
  } else {
    console.error('[ERRO] Formulário de login não encontrado');
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