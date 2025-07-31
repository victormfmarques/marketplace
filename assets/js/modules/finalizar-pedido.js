document.addEventListener("DOMContentLoaded", () => {
  const btnFinalizar = document.querySelector("#registrar-pedido");

  if (!btnFinalizar) return;

  btnFinalizar.addEventListener("click", async () => {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    const carrinho = JSON.parse(localStorage.getItem(`carrinho_${usuario?.email}`)) || [];

    if (!usuario || !usuario._id) {
      mostrarFeedback('Por favor, faça login para acessar esta página', 'erro');
      setTimeout(() => window.location.href = '/index.html', 2000);
      return;
  }

    if (carrinho.length === 0) {
      mostrarFeedback('Seu carrinho está vazio', 'aviso');
      return;
    }

    const total = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);

    try {
      const response = await fetch("/api/perfil/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuario._id,
          produtos: carrinho,
          total
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.removeItem(`carrinho_${usuario.email}`);
        mostrarFeedback('Pedido registrado com sucesso!', 'aviso');
        setTimeout(() => {
          window.location.href = "/paginas/pedidos.html";
        }, 2000);
      } else {
        mostrarFeedback('Erro ao registrar o pedido', 'aviso');
      }
    } catch (error) {
      console.error("Erro:", error);
      mostrarFeedback('Ocorreu um erro ao finalizar o pedido', 'aviso');
    }
  });
});