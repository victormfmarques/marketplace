document.addEventListener('DOMContentLoaded', () => {
  // Carrega os dados do usuário
  const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

  if (!usuarioLogado) {
    alert('Por favor, faça login para acessar esta página');
    window.location.href = 'index.html';
    return;
  }

  // Preenche o formulário com os dados do usuário
  preencherFormulario(usuarioLogado);

  // Configura o evento de submit do formulário
  document.getElementById('form-perfil').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSubmit = document.getElementById('enviar');
    const btnLogout = document.getElementById('btn-logout');

    try {
      // Desabilita os botões durante a requisição
      btnSubmit.disabled = true;
      btnLogout.disabled = true;
      btnSubmit.value = 'Atualizando...';

      // Obtém os dados do formulário
      const formData = {
        userId: usuarioLogado._id,
        nome: document.getElementById('inome').value,
        sexo: document.querySelector('input[name="sexo"]:checked')?.value,
        dataNascimento: document.getElementById('idat').value,
        telefone: document.getElementById('itel').value,
        email: document.getElementById('iemail').value,
        senha: document.getElementById('isenha').value,
        novaSenha: document.getElementById('inova-senha').value || null // Só envia se foi preenchida
      };

      // Validação básica
      if (!formData.nome || !formData.email) {
        throw new Error('Nome e email são obrigatórios');
      }

      // Se nova senha foi informada, verifica se a atual foi fornecida
      if (formData.novaSenha && !formData.senhaAtual) {
        throw new Error('Para alterar a senha, informe a senha atual');
      }

      // Envia para a API
      const response = await fetch('/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar perfil');
      }

      // Atualiza os dados locais
      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      document.getElementById('saudacao').textContent = `Olá, ${data.usuario.nome}!`;

      alert('Perfil atualizado com sucesso!');

      // Limpa os campos de senha se existirem
      if (document.getElementById('isenha-atual')) {
        document.getElementById('isenha-atual').value = '';
      }
      if (document.getElementById('isenha-nova')) {
        document.getElementById('isenha-nova').value = '';
      }

    } catch (error) {
      console.error('Erro na atualização:', error);
      alert(error.message || 'Erro ao atualizar perfil');
    } finally {
      btnSubmit.disabled = false;
      btnLogout.disabled = false;
      btnSubmit.value = 'Atualizar Perfil';
    }
  });

  // Configura o logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
  });
});

function preencherFormulario(usuario) {
  document.getElementById('inome').value = usuario.nome || '';
  document.getElementById('idat').value = usuario.dataNascimento?.split('T')[0] || '';
  document.getElementById('itel').value = usuario.telefone || '';
  document.getElementById('iemail').value = usuario.email || '';

  // Marca o sexo correto
  if (usuario.sexo === 'masculino') {
    document.getElementById('imas').checked = true;
  } else if (usuario.sexo === 'feminino') {
    document.getElementById('ifem').checked = true;
  }

  // Atualiza a saudação
  document.getElementById('saudacao').textContent = `Olá, ${usuario.nome}!`;
}