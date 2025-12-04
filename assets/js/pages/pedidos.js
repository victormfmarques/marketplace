// assets/js/pages/pedidos.js

// =========================== IMPORTAÇÕES ===============================
import { mostrarFeedback, criarLoader, criarMensagemErro } from '../modules/ui.js';
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
  modal.classList.remove("hidden");
}

/* =============================================
  FUNÇÃO PARA FECHAR MODAL
============================================= */
function closeModal() {
  modal.classList.add("hidden")
  currentOrderId = null;
  cancelReason.value = "";
  document.getElementById("cancelPassword").value = "";
}

/* =============================================
  FUNÇÃO PARA RENDERIZAR OS PEDIDOS NA TELA
============================================= */
function renderizarPedidos(pedidos) {
    const listaPedidos = document.getElementById('lista-pedidos');
    if (!listaPedidos) return;

    if (!pedidos || pedidos.length === 0) {
        listaPedidos.innerHTML = criarMensagemErro(
            "Você ainda não fez nenhum pedido.",
            "info"
        );
        return;
    }

    listaPedidos.innerHTML = pedidos.map(pedido => {
        // --- FORMATAÇÃO DE DATA E HORA (À PROVA DE BALAS) ---
        let dataFormatada = 'Data indisponível';
        try {
            const dataObj = new Date(pedido.dataPedido);
            if (isNaN(dataObj.getTime())) {
                throw new Error('Data inválida da API');
            }
            // Formata para "dd/mm/aaaa, HH:MM:SS"
            dataFormatada = dataObj.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).replace(',', ''); // Remove a vírgula entre data e hora
        } catch (e) {
            console.error(`Erro ao formatar data para o pedido ${pedido._id}:`, e.message);
        }

        // --- DESCRIÇÃO DO STATUS (COMO NO SEU LAYOUT ORIGINAL) ---
        let statusDesc = '';
        switch (pedido.status) {
            case 'pendente':
                statusDesc = 'O vendedor foi notificado por e-mail. Aguarde o contato para combinar pagamento e entrega.';
                break;
            case 'em andamento':
                statusDesc = 'O vendedor está preparando seu pedido para entrega.';
                break;
            case 'enviado':
                statusDesc = 'Seu pedido foi enviado e está a caminho.';
                break;
            case 'entregue':
                statusDesc = 'Seu pedido foi entregue com sucesso!';
                break;
            case 'cancelado':
                statusDesc = 'Este pedido foi cancelado.';
                break;
            default:
                statusDesc = 'Status do pedido não reconhecido.';
        }

        // --- LISTA DE PRODUTOS ---
        const produtosHTML = pedido.produtos.map(p => 
            `<li>${p.nome} (x${p.quantidade}) - R$ ${p.preco.toFixed(2).replace('.', ',')}</li>`
        ).join('');

        // --- BOTÃO DE CANCELAR ---
        const podeCancelar = pedido.status === 'pendente' || pedido.status === 'em andamento' || pedido.status === 'enviado';
        const botaoCancelarHTML = podeCancelar 
            ? `<button class="btn-cancelar-pedido" data-id="${pedido._id}">Cancelar</button>`
            : ''; // Não mostra botão se não puder cancelar

        // --- MONTAGEM DO HTML FINAL (RECRIANDO SEU LAYOUT ORIGINAL) ---
        return `
            <div class="pedido-comprador-card" data-status="${pedido.status.toLowerCase()}">
                <div class="pedido-comprador-header">
                    <h4>Pedido #${pedido._id.slice(-6)}</h4>
                    <span class="pedido-status">${pedido.status}</span>
                </div>
                <div class="pedido-comprador-body">
                    <p><strong>Data do Pedido:</strong> ${dataFormatada}</p>
                    <p class="status-descricao"><em>${statusDesc}</em></p>
                    
                    <strong>Itens do seu pedido:</strong>
                    <ul class="pedido-produtos-lista">
                        ${produtosHTML}
                    </ul>
                </div>
                <div class="pedido-comprador-footer">
                    <span class="total-pedido">Total: R$ ${pedido.total.toFixed(2).replace('.', ',')}</span>
                    ${botaoCancelarHTML}
                </div>
            </div>
        `;
    }).join('');

    // Adiciona os event listeners para os novos botões de cancelar
    document.querySelectorAll('.btn-cancelar-pedido').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pedidoId = e.target.dataset.id;
            // Certifique-se de que a função para abrir o modal se chama 'openModal'
            openModal(pedidoId); 
        });
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
  lista.innerHTML = criarLoader("Carregando seus pedidos...");

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