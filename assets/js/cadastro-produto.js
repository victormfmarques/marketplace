document.getElementById('form-produto').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
  if (!usuario) {
    alert('Faça login para cadastrar produtos');
    window.location.href = '/login.html';
    return;
  }

  // Converte imagens para Base64
  const fotosBase64 = await Promise.all(
    Array.from(document.getElementById('fotos').files).map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    })
  );

  const produto = {
    usuarioId: usuario._id,
    nome: document.getElementById('nome').value,
    descricao: document.getElementById('descricao').value,
    preco: document.getElementById('preco').value,
    categoria: document.getElementById('categoria').value,
    fotosBase64
  };

  try {
    const response = await fetch('/api/produtos/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produto)
    });

    const data = await response.json();
    if (data.success) {
      alert('Produto cadastrado com sucesso!');
      window.location.href = '/paginas/produtos.html';
    } else {
      alert('Erro: ' + (data.error || 'Falha no cadastro'));
    }
  } catch (error) {
    console.error(error);
    alert('Falha na conexão');
  }
});