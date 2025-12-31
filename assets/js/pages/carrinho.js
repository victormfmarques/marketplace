import { mostrarFeedback } from "../modules/ui.js";

function getUsuario() {
  return JSON.parse(localStorage.getItem("usuarioLogado"));
}

function getCarrinho(usuario) {
  const chave = usuario?.email ? `carrinho_${usuario.email}` : "carrinho_anonimo";
  return JSON.parse(localStorage.getItem(chave)) || [];
}

function salvarCarrinho(usuario, carrinho) {
  const chave = usuario?.email ? `carrinho_${usuario.email}` : "carrinho_anonimo";
  localStorage.setItem(chave, JSON.stringify(carrinho));
}

function renderizarCarrinho() {
  const usuario = getUsuario();
  const carrinho = getCarrinho(usuario);

  const lista = document.getElementById("lista-carrinho");
  const totalItens = document.getElementById("total-itens");
  const totalPreco = document.getElementById("total-preco");
  const btnFinalizar = document.getElementById("btn-finalizar");

  lista.innerHTML = "";

  if (carrinho.length === 0) {
    lista.innerHTML = "<p>Seu carrinho está vazio.</p>";
    btnFinalizar.disabled = true;
    totalItens.textContent = "Itens: 0";
    totalPreco.textContent = "Total: R$ 0,00";
    return;
  }

  let total = 0;
  let itens = 0;

  carrinho.forEach((item, index) => {
    total += item.preco * item.quantidade;
    itens += item.quantidade;

    const div = document.createElement("div");
    div.className = "item-carrinho";

    div.innerHTML = `
      <div class="item-info">
        <h3>${item.nome}</h3>
        <p>Vendedor: ${item.vendedor?.nome || "Não informado"}</p>
        <p>Quantidade: ${item.quantidade}</p>
        <p>Subtotal: R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</p>
      </div>

      <div class="item-acoes">
        <button data-index="${index}">
          <i class="fas fa-trash"></i> Remover
        </button>
      </div>
    `;

    lista.appendChild(div);
  });

  totalItens.textContent = `Itens: ${itens}`;
  totalPreco.textContent = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
  btnFinalizar.disabled = false;

  document.querySelectorAll(".item-acoes button").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.dataset.index;
      carrinho.splice(index, 1);
      salvarCarrinho(usuario, carrinho);
      mostrarFeedback("Item removido do carrinho", "sucesso");
      renderizarCarrinho();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const usuario = getUsuario();

  if (!usuario) {
    mostrarFeedback("Faça login para acessar o carrinho", "erro");
    setTimeout(() => window.location.href = "/paginas/login.html", 2000);
    return;
  }

  document.getElementById("btn-finalizar").addEventListener("click", () => {
    window.location.href = "/paginas/finalizar-compra.html";
  });

  renderizarCarrinho();
});
