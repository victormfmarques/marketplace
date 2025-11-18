// assets/js/pages/pedidos.js

// =========================== IMPORTAÇÕES ===============================
import { mostrarFeedback } from '../modules/ui.js';
import { pedidosAPI } from '../modules/api.js';
// =======================================================================

const lista = document.getElementById("lista-pedidos");
const modal = document.getElementById("cancelModal");
const cancelReason = document.getElementById("cancelReason");
const confirmCancelBtn = document.getElementById("confirmCancel");
const closeModalBtn = document.getElementById("closeModal");

let currentOrderId = null;

/* =============================================
  FUNÇÃO PARA ABRIR MODAL DE CANCELAMENTO
============================================= */
function openModal(orderId) {
  currentOrderId = orderId;
  cancelReason.value = "";
  document.getElementById("cancelPassword").value = "";
  modal.style.display = "flex";
}

/* =============================================
  FUNÇÃO PARA FECHAR MODAL
============================================= */
function closeModal() {
  modal.style.display = "none";
  currentOrderId = null;
  cancelReason.value = "";
  document.getElementById("cancelPassword").value = "";
}

/* =============================================
  FUNÇÃO PARA RENDERIZAR OS PEDIDOS NA TELA
============================================= */
function renderizarPedidos(pedidos) {
  if (!pedidos || pedidos.length === 0) {
    lista.innerHTML = window.criarMensagem(
      "Você ainda não fez nenhum pedido.",
      "info",
      null // sem botão de tentar novamente
    );
    return;
  }

  lista.innerHTML = "";
  pedidos.forEach(pedido => {
    const card = document.createElement("div");
    card.classList.add("pedido");

    const produtosHTML = pedido.produtos.map(prod =>
      `<li>${prod.nome} (x${prod.quantidade}) - R$ ${prod.preco.toFixed(2).replace('.', ',')}</li>`
    ).join("");

    const statusVisivel = pedido.status === "pendente" ? "pedido enviado ao vendedor" : pedido.status;
    const mensagemInfo = pedido.status === "pendente"
      ? `<p class="aviso">O vendedor foi notificado por e-mail. Aguarde o contato para combinar pagamento e entrega.</p>`
      : "";

    card.innerHTML = `
      <h3>Pedido ${pedido._id}</h3>
      <p><strong>Data:</strong> ${new Date(pedido.dataPedido).toLocaleString()}</p>
      <p><strong>Status:</strong> ${statusVisivel}</p>
      ${mensagemInfo}
      <ul>${produtosHTML}</ul>
      <p><strong>Total:</strong> R$ ${pedido.total.toFixed(2).replace('.', ',')}</p>
      ${pedido.status === "pendente" ? `<button data-id="${pedido._id}">Cancelar</button>` : ""}
    `;

    lista.appendChild(card);
  });

  // Associa evento para abrir modal nos botões cancelar
  document.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
}

/* =============================================
  FUNÇÃO PARA BUSCAR PEDIDOS DO USUÁRIO
============================================= */
async function carregarPedidos() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const usuarioId = usuario?._id;

  if (!usuarioId) {
    mostrarFeedback('Por favor, faça login para acessar esta página', 'erro');
    setTimeout(() => window.location.href = '/index.html', 2000);
    return;
  }

  // Exibe loader
  lista.innerHTML = window.criarLoader("Carregando seus pedidos...");

  try {
    const pedidos = await pedidosAPI.listar(usuarioId);

    renderizarPedidos(pedidos);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);

      window.mostrarErro(
        lista,
        'Não foi possível carregar seus pedidos',
        navigator.onLine
          ? 'Ocorreu um erro interno no servidor. Tente novamente em alguns instantes.'
          : 'Parece que você está sem conexão com a internet.',
        carregarPedidos,
        'tentar-novamente-pedidos'
      );

    const btn = document.getElementById("tentar-novamente-pedidos");
      if (btn) {
        btn.addEventListener("click", () => {
          lista.innerHTML = window.criarLoader("Carregando seus pedidos...");
          setTimeout(() => carregarPedidos(), 300);
        });
      }
  }
}

/* =============================================
  FUNÇÃO PARA CANCELAR PEDIDO
============================================= */
async function cancelarPedido() {
  if (!currentOrderId) return;

  const password = document.getElementById("cancelPassword").value.trim();
  if (!password) {
    mostrarFeedback("Digite sua senha para confirmar.", "erro");
    return;
  }

  try {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    const data = await pedidosAPI.cancelar({
        pedidoId: currentOrderId,
        motivo: cancelReason.value.trim() || "Motivo não informado",
        usuarioId: usuario._id,
        email: usuario.email,
        senha: password
    });

    if (data.success) {
      mostrarFeedback('Solicitação de cancelamento enviada ao vendedor!', 'aviso');
      closeModal();
      setTimeout(() => carregarPedidos(), 2000);
    } else {
      mostrarFeedback(data.message || 'Erro ao enviar solicitação.', 'erro');
    }
  } catch (err) {
    console.error(err);
    mostrarFeedback('Erro na comunicação com o servidor.', 'erro');
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", carregarPedidos);
closeModalBtn.addEventListener("click", closeModal);
confirmCancelBtn.addEventListener("click", cancelarPedido);

// Export caso queira usar em outros módulos
export { carregarPedidos, renderizarPedidos };