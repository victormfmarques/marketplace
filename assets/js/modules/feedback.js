// js/modules/feedback.js
export function mostrarFeedback(mensagem) {
  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.textContent = mensagem;
    feedback.classList.add('show');
    setTimeout(() => feedback.classList.remove('show'), 3000);
  }
}