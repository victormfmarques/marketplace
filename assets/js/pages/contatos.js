// assets/js/pages/contatos.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-feedback');
  const btnEnviar = document.getElementById('btn-enviar');
  if (!form || !btnEnviar) return;

  let enviando = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (enviando) return;
    enviando = true;
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    const mensagem = document.getElementById('mensagem')?.value.trim();
    const email = document.getElementById('email')?.value.trim();

    if (!mensagem) {
      mostrarFeedback('Mensagem não pode ser vazia', 'erro');
      return;
    }

    try {
      const res = await fetch('/api?rota=feedback/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem, email })
      });

      const resultado = await res.json();

      if (res.ok) {
        mostrarFeedback('Feedback enviado com sucesso', 'sucesso');
        form.reset();
      } else {
        mostrarFeedback('Erro ao enviar feedback', 'erro');
      }
    
    } catch (err) {
      mostrarFeedback('Erro de conexão com o servidor', 'erro');
    
    } finally {
      enviando = false;
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Enviar feedback';
    }
  });
});