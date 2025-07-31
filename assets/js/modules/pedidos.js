document.addEventListener("DOMContentLoaded", async () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const usuarioId = usuario?._id;
  const lista = document.getElementById("lista-pedidos");

  if (!usuarioId) {
    mostrarFeedback('Por favor, faça login para acessar esta página', 'erro');
    setTimeout(() => window.location.href = '/index.html', 2000);
    return;
  }

  try {
    const res = await fetch(`/api/perfil/pedidos.js?usuarioId=${usuarioId}`);
    const pedidos = await res.json();

    if (pedidos.length === 0) {
      lista.innerHTML = "<p>Você ainda não fez nenhum pedido.</p>";
      return;
    }

    lista.innerHTML = "";
    pedidos.forEach(pedido => {
      const card = document.createElement("div");
      card.classList.add("pedido");

      const produtosHTML = pedido.produtos.map(prod =>
        `<li>${prod.nome} (x${prod.quantidade}) - R$ ${prod.preco.toFixed(2)}</li>`
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
        <p><strong>Total:</strong> R$ ${pedido.total.toFixed(2)}</p>
        ${pedido.status === "pendente" ? `<button data-id="${pedido._id}">Cancelar</button>` : ""}
      `;

      lista.appendChild(card);
    });

    // Modal e variáveis do modal
    const modal = document.getElementById("cancelModal");
    const cancelReason = document.getElementById("cancelReason");
    const confirmCancelBtn = document.getElementById("confirmCancel");
    const closeModalBtn = document.getElementById("closeModal");
    let currentOrderId = null;

    // Funções para abrir e fechar modal
    function openModal(orderId) {
      currentOrderId = orderId;
      cancelReason.value = "";
      document.getElementById("cancelPassword").value = "";
      modal.style.display = "flex";
    }

    function closeModal() {
      modal.style.display = "none";
      currentOrderId = null;
      cancelReason.value = "";
      document.getElementById("cancelPassword").value = "";
    }

    closeModalBtn.addEventListener("click", closeModal);

    // Evento para confirmar cancelamento, com verificação da senha
    confirmCancelBtn.addEventListener("click", async () => {
      if (!currentOrderId) return;

      const password = document.getElementById("cancelPassword").value.trim();
      if (!password) {
        mostrarFeedback("Digite sua senha para confirmar.", "erro");
        return;
      }

      try {
        const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
        const res = await fetch("/api/perfil/cancelarPedido", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pedidoId: currentOrderId,
            motivo: cancelReason.value.trim() || "Motivo não informado",
            usuarioId: usuario._id,
            email: usuario.email,
            senha: password
          })
        });

        const data = await res.json();
        if (data.success) {
          mostrarFeedback('Solicitação de cancelamento enviada ao vendedor!', 'aviso');
          closeModal();
          setTimeout(() => location.reload(), 2000);
        } else {
          mostrarFeedback(data.message || 'Erro ao enviar solicitação.', 'erro');
        }
      } catch (err) {
        console.error(err);
        mostrarFeedback('Erro na comunicação com o servidor.', 'erro');
      }
    });

    // Associa evento para abrir modal nos botões cancelar
    document.querySelectorAll("button[data-id]").forEach(btn => {
      btn.addEventListener("click", () => openModal(btn.dataset.id));
    });

  } catch (err) {
    lista.innerHTML = "<p>Erro ao carregar os pedidos.</p>";
    console.error(err);
  }
});
