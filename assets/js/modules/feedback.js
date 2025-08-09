// js/modules/feedback.js
export function mostrarFeedback(mensagem, tipo = 'sucesso', tempo = 3000) {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;

  // Reset e configuração
  feedback.textContent = mensagem;
  feedback.className = 'feedback'; // Remove todas as classes
  feedback.classList.add(tipo); // Adiciona a classe do tipo

  // Força reflow para reiniciar animação
  void feedback.offsetWidth;

  feedback.classList.add('show');
  
  // Auto-esconder após X segundos
  clearTimeout(feedback._hideTimeout);
  feedback._hideTimeout = setTimeout(() => {
    feedback.classList.remove('show');
  }, tempo);
}

// Torna a função global para ser usada fora do módulo
window.mostrarFeedback = mostrarFeedback;
