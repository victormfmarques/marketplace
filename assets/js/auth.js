document.addEventListener('DOMContentLoaded', () => {
  // ========== LOGIN ==========
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnLogin = document.getElementById('btn-login');
    const emailInput = document.getElementById('iemail');
    const senhaInput = document.getElementById('isenha');

    if (!btnLogin || !emailInput || !senhaInput) {
      console.error('Elementos do formulário não encontrados!');
      return;
    }

    try {
      // Estado de loading
      btnLogin.disabled = true;
      btnLogin.value = 'Autenticando...';

      // Validação básica
      const email = emailInput.value.trim();
      const senha = senhaInput.value;

      if (!email || !senha) {
        throw new Error('Por favor, preencha todos os campos');
      }

      // Requisição com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const response = await fetch('/api/perfil/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Tratamento da resposta
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro no servidor durante o login');
      }

      // Armazenamento seguro do usuário
      localStorage.setItem('usuarioLogado', JSON.stringify({
        ...data.usuario,
        authTime: new Date().toISOString() // Timestamp de autenticação
      }));

      // Redirecionamento seguro
      window.location.href = data.redirect || '/paginas/home.html';

    } catch (error) {
      console.error('Erro no login:', error);
      alert(error.message || 'Falha na autenticação. Tente novamente.');

      // Foca no campo problemático
      if (error.message.includes('email')) {
        emailInput.focus();
      } else if (error.message.includes('senha')) {
        senhaInput.focus();
      }
    } finally {
      if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.value = 'Entrar';
      }
    }
  });

  // ========== CADASTRO ==========
  document.getElementById('form-cadastro')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnCadastro = document.querySelector('#form-cadastro button[type="submit"]');

    try {
      // Estado de loading
      if (btnCadastro) {
        btnCadastro.disabled = true;
        btnCadastro.textContent = 'Registrando...';
      }

      // Primeiro obtenha todos os valores necessários
      const senha = document.getElementById('isenha')?.value;
      const confirmacaoSenha = document.getElementById('iconfirmasenha')?.value;


      // Validação dos dados
      const usuario = {
        nome: document.getElementById('inome')?.value.trim(),
        sexo: document.querySelector('input[name="sexo"]:checked')?.value || '',
        dataNascimento: document.getElementById('idat')?.value,
        telefone: document.getElementById('itel')?.value.replace(/\D/g, ''),
        email: document.getElementById('iemail')?.value.trim(),
        senha: senha // Use a variável que acabamos de definir
      };

      // Validação básica
      if (!usuario.email || !senha || !confirmacaoSenha) {
        throw new Error('Email e senha são obrigatórios');
      }

      if (senha.length < 8) {
        throw new Error('A senha deve ter pelo menos 8 caracteres');
      }

      // Validação da confirmação de senha
      if (senha !== confirmacaoSenha) {
        throw new Error('A senha e a confirmação não coincidem');
      }

      // Requisição
      const response = await fetch('/api/perfil/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro no cadastro');
      }

      // Armazenamento e redirecionamento
      localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
      alert('Cadastro realizado com sucesso!');
      window.location.href = data.redirect || '/paginas/home.html';

    } catch (error) {
      console.error('Erro no cadastro:', error);

      // Destaca os campos com erro
      if (error.message.includes('não coincidem')) {
        document.getElementById('isenha').style.border = '1px solid red';
        document.getElementById('iconfirmasenha').style.border = '1px solid red';
      }

      alert(error.message || 'Falha no cadastro. Verifique os dados e tente novamente.');
    } finally {
      if (btnCadastro) {
        btnCadastro.disabled = false;
        btnCadastro.textContent = 'Cadastrar';
      }
    }
  });

  // Validação em tempo real da confirmação de senha
  document.getElementById('iconfirmasenha')?.addEventListener('input', function () {
    const senha = document.getElementById('isenha').value;
    const confirmacao = this.value;

    if (senha && confirmacao && senha !== confirmacao) {
      this.classList.add('error-border');
      document.getElementById('isenha').classList.add('error-border');
    } else {
      this.classList.remove('error-border');
      document.getElementById('isenha').classList.remove('error-border');
    }
  });
});

function formatarTelefone(telefone) {
  // Remove tudo que não é dígito
  const apenasNumeros = telefone.replace(/\D/g, '');

  // Aplica a formatação (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
  if (apenasNumeros.length === 10) {
    return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 6)}-${apenasNumeros.substring(6)}`;
  } else if (apenasNumeros.length === 11) {
    return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 7)}-${apenasNumeros.substring(7)}`;
  }

  // Retorna sem formatação se não tiver tamanho adequado
  return telefone;
}

// Exemplo de uso:
const telefoneFormatado = formatarTelefone('11987654321');
console.log(telefoneFormatado); // (11) 98765-4321

// Adicione isso no DOMContentLoaded
document.getElementById('itel')?.addEventListener('input', function (e) {
  // Obtém a posição do cursor
  const cursorPosition = e.target.selectionStart;
  const input = e.target;
  let value = input.value.replace(/\D/g, '');

  // Formatação dinâmica
  if (value.length > 0) {
    value = `(${value.substring(0, 2)}${value.length > 2 ? ') ' : ''}${value.substring(2)}`;
  }
  if (value.length > 10) {
    value = `${value.substring(0, 10)}-${value.substring(10, 15)}`;
  }

  input.value = value;

});