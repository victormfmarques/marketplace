// js/modules/feedback.js
export function mostrarFeedback(mensagem) {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;

  feedback.textContent = mensagem;
  feedback.classList.remove('show'); // remove se já estiver visível

  // força reflow para reiniciar a animação
  void feedback.offsetWidth;

  feedback.classList.add('show');
  clearTimeout(feedback._hideTimeout);
  feedback._hideTimeout = setTimeout(() => {
    feedback.classList.remove('show');
  }, 3000);
}

// Torna a função global para ser usada fora do módulo
window.mostrarFeedback = mostrarFeedback;
