// assets/js/pages/finalizar-pedido.js

// =========================== IMPORTAÇÕES ===============================
import { authAPI } from "../modules/api.js";
import { pedidosAPI } from "../modules/api.js";
import { mostrarFeedback } from "../modules/ui.js";
// =======================================================================

document.addEventListener("DOMContentLoaded", () => {
  const btnFinalizar = document.querySelector("#registrar-pedido");
  const modal = document.querySelector("#modal-confirmar-pedido");
  const btnConfirmar = document.querySelector("#confirmar-pedido");
  const btnCancelar = document.querySelector("#cancelar-pedido");
  const senhaInput = document.querySelector("#senha-confirmacao");
  const erroSenha = document.querySelector("#erro-senha");

  if (!btnFinalizar) return;

  btnFinalizar.addEventListener("click", (e) => {
    e.preventDefault(); // Impede recarregar a página
    modal.classList.add("modal-open"); // Exibe o modal
    senhaInput.value = "";
  });
  
  btnCancelar.addEventListener("click", () => {
    modal.classList.remove("modal-open");
    senhaInput.value = "";
  });

  btnConfirmar.addEventListener("click", async () => {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    const carrinho = JSON.parse(localStorage.getItem(`carrinho_${usuario?.email}`)) || [];
    const senha = senhaInput.value.trim();

    if (!usuario || !usuario._id) {
      mostrarFeedback('Por favor, faça login para acessar esta página', 'erro');
      setTimeout(() => window.location.href = '/index.html', 2000);
      return;
    }

    if (carrinho.length === 0) {
      mostrarFeedback('Seu carrinho está vazio', 'aviso');
      return;
    }

    if (!senha) {
      mostrarFeedback('Digite sua senha.', 'aviso')
      return;
    }

    try {
      // 1. Verifica a senha usando a API de autenticação.
      // Se a senha estiver errada, a função 'login' vai lançar um erro e o código vai pular para o 'catch'.
      await authAPI.login(usuario.email, senha);

      // 2. Se a senha estiver correta, registra o pedido usando a API de pedidos.
      const total = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
      const data = await pedidosAPI.registrar({
          usuarioId: usuario._id,
          produtos: carrinho,
          total
      });

      if (data.success) {
        localStorage.removeItem(`carrinho_${usuario.email}`);
        mostrarFeedback('Pedido registrado com sucesso!', 'sucesso');
        modal.classList.remove("modal-open");
        setTimeout(() => {
          window.location.href = "/paginas/pedidos.html";
        }, 2000);
      } else {
        mostrarFeedback('Erro ao registrar o pedido', 'erro');
      }
    } catch (error) {
      console.error("Erro:", error);
      mostrarFeedback('Erro ao confirmar o pedido', 'erro');
    }
  });
});
