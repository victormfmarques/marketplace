// assets/js/pages/finalizar-pedido.js

// =========================== IMPORTAÇÕES ===============================
import { authAPI, pedidosAPI } from "../modules/api.js";
import { mostrarFeedback } from "../modules/ui.js";
// =======================================================================

function getChaveCarrinho(usuario) {
    return usuario?.email ? `carrinho_${usuario.email}` : 'carrinho_anonimo';
}

function formatarTelefone(telefone) {
    if (!telefone) return 'Não informado';
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (numeros.length === 10) return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return telefone;
}

function renderizarResumo(carrinho) {
    const container = document.getElementById('resumo-carrinho');
    if (!container) return;

    if (!carrinho || carrinho.length === 0) {
        container.innerHTML = "<p>Seu carrinho está vazio. Volte para a loja para adicionar produtos.</p>";
        // Opcional: desabilitar o botão de finalizar se o carrinho estiver vazio
        const btnFinalizar = document.querySelector("#registrar-pedido");
        if(btnFinalizar) btnFinalizar.style.display = 'none';
        return;
    }

    const html = carrinho.map(item => `
        <div class="produto">
            <h2>${item.nome}</h2>
            <p><strong>Preço:</strong> R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')} (x${item.quantidade})</p>
            <p><strong>Vendedor:</strong> ${item.vendedor?.nome || 'Desconhecido'}</p>
            <p><strong>Email:</strong> 
                <a href="mailto:${item.vendedor.email}" class="email">
                    <i class="fas fa-envelope"></i> ${item.vendedor.email}
                </a>
            </p>
            <p><strong>Telefone:</strong> 
                <a href="https://wa.me/55${item.vendedor.telefone.replace(/\D/g, '' )}" class="whatsapp" target="_blank">
                    <i class="fab fa-whatsapp"></i> ${formatarTelefone(item.vendedor.telefone)}
                </a>
            </p>
            <hr>
        </div>
    `).join('');
    container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", () => {
  
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    // Guarda de rota
    if (!usuario) {
        mostrarFeedback('Faça login para finalizar a compra.', 'erro');
        setTimeout(() => window.location.href = '/paginas/login.html', 2000);
        return;
    }
  // Pega o carrinho e desenha na tela
    const chaveCarrinho = getChaveCarrinho(usuario);
    const carrinho = JSON.parse(localStorage.getItem(chaveCarrinho)) || [];
    renderizarResumo(carrinho);

  const btnFinalizar = document.querySelector("#registrar-pedido");
  const modal = document.querySelector("#modal-confirmar-pedido");
  const btnConfirmar = document.querySelector("#confirmar-pedido");
  const btnCancelar = document.querySelector("#cancelar-pedido");
  const senhaInput = document.querySelector("#senha-confirmacao");
  const erroSenha = document.querySelector("#erro-senha");

  if (!btnFinalizar) return;

  // ABRIR O MODAL
  btnFinalizar.addEventListener("click", (e) => {
    e.preventDefault(); // Impede recarregar a página
    senhaInput.value = "";
    modal.classList.remove("hidden");
  });
  
  // FECHAR O MODAL
  btnCancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
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
        modal.classList.add("hidden");
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
