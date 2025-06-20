document.addEventListener('DOMContentLoaded', function() {
  // 1. Recupera os dados do usuário
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
  
  if (!usuario) {
    window.location.href = '/login.html';
    return;
  }

  // 2. Preenche o formulário com os dados
  document.getElementById('inome').value = usuario.nome || '';
  document.getElementById('iemail').value = usuario.email || '';
  
  // Preenche gênero
  if (usuario.sexo) {
    document.getElementById(usuario.sexo === 'masculino' ? 'imas' : 'ifem').checked = true;
  }
  
  // Preenche data (formato YYYY-MM-DD)
  if (usuario.dataNascimento) {
    const data = new Date(usuario.dataNascimento);
    document.getElementById('idat').value = data.toISOString().split('T')[0];
  }
  
  document.getElementById('itel').value = usuario.telefone || '';

  // 3. Configura o envio do formulário
  document.getElementById('form-perfil').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/atualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: document.getElementById('inome').value,
          sexo: document.querySelector('input[name="sexo"]:checked')?.value,
          dataNascimento: document.getElementById('idat').value,
          telefone: document.getElementById('itel').value,
          email: document.getElementById('iemail').value,
          senha: document.getElementById('isenha').value || undefined
        })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
        alert('Perfil atualizado com sucesso!');
      } else {
        alert(data.message || 'Erro ao atualizar');
      }
    } catch (error) {
      console.error(error);
      alert('Falha na conexão');
    }
  });

  // 4. Botão de logout
  document.getElementById('btn-logout').addEventListener('click', function() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = '/login.html';
  });
});