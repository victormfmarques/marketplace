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

    const sexoSelecionado = document.querySelector('input[name="sexo"]:checked')?.value;  

      // Obtém os dados do formulário
      const formData = {
        userId: usuarioLogado._id,
        nome: document.getElementById('inome').value,
        sexo: sexoSelecionado, // Isso agora vai capturar "masculino" ou "feminino"
        dataNascimento: document.getElementById('idat').value,
        telefone: document.getElementById('itel').value,
        email: document.getElementById('iemail').value,
        senha: document.getElementById('isenha').value,
        nsenha: document.getElementById('insenha').value || null // Só envia se foi preenchida
      };

      // Validação básica
      if (!formData.nome || !formData.email) {
        throw new Error('Nome e email são obrigatórios');
      }

      // Se nova senha foi informada, verifica se a atual foi fornecida
      if (formData.nsenha && !formData.senha) {
        throw new Error('Para alterar a senha, informe a senha atual');
      }

      // Envia para a API
      const response = await fetch('/api/atualizar', {
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
      if (document.getElementById('isenha')) {
        document.getElementById('isenha').value = '';
      }
      if (document.getElementById('insenha')) {
        document.getElementById('insenha').value = '';
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
    window.location.href = '/index.html';
  });
});

function preencherFormulario(usuario) {
  document.getElementById('inome').value = usuario.nome || '';
  document.getElementById('idat').value = usuario.dataNascimento?.split('T')[0] || '';
  document.getElementById('itel').value = usuario.telefone || '';
  document.getElementById('iemail').value = usuario.email || '';

  // Corrige para lidar com o valor "on" incorreto
  const generoCorrigido = usuario.sexo === 'on' ? 
                         (usuario.genero || 'masculino') : // fallback caso exista outro campo
                         usuario.sexo;
  
  // Normaliza o valor
  const genero = generoCorrigido.toLowerCase().trim();
  
  // Marca o radio button correto
  document.getElementById('imas').checked = genero.includes('masc');
  document.getElementById('ifem').checked = genero.includes('fem');

  // Atualiza a saudação
  document.getElementById('saudacao').textContent = `Olá, ${usuario.nome}!`;
}