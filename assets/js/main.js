// /js/main.js
import { config } from './modules/config.js';
import {inicializarProdutos,renderizarProdutos,configurarEventosProdutos} from './modules/produtos.js';
import { setupCarrinho } from './modules/carrinho.js';
import { mostrarFeedback } from './modules/feedback.js';

/* =============================================
  CARREGAMENTO E NOTIFICAÇÃO DE ERRO
============================================= */
/**
 * Cria um loader com spinner e texto opcional
 * @param {string} texto - Texto a exibir abaixo do spinner
 * @returns {string} HTML do loader
 */
export function criarLoader(texto = "Carregando...") {
  return `
    <div class="loader-container" role="status" aria-live="polite" style="text-align:center; padding:2rem;">
      <div class="loader-spinner" style="
          border: 6px solid var(--branco-neve);
          border-top: 6px solid var(--verde-folha);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem auto;
      "></div>
      <p>${texto}</p>
    </div>
  `;
}

/**
 * Cria uma mensagem de erro ou aviso
 * @param {string} texto - Texto da mensagem
 * @param {'erro'|'aviso'|'info'} tipo - Tipo da mensagem
 * @param {string} btnId - ID do botão "Tentar novamente" opcional
 * @param {string} btnTexto - Texto do botão (opcional)
 * @returns {string} HTML da mensagem
 */
export function criarMensagemErro(texto, tipo = 'erro', btnId = null, btnTexto = '<i class="fa-solid fa-rotate"></i> Tentar novamente') {
  return `
    <div class="erro-ecocommerce" role="alert" style="
        text-align:center;
        background-color: var(--branco-neve);
        color: var(--cinza-pedra);
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        margin: 1rem auto;
        max-width: 500px;
        border: 2px solid var(--verde-folha)
    ">
      <i class="fas fa-${tipo === 'erro' ? 'leaf' : 'info-circle'}" style="font-size: 32px; color: var(--verde-folha);" aria-hidden="true"></i>
      <h3 style="margin-top: 12px; color: var(--verde-folha);">${texto}</h3>
      ${btnId ? `<button id="${btnId}" class="btn-tentar-novamente">${btnTexto}</button>` : ''}
    </div>
  `;
}

/* =============================================
  FUNÇÕES GLOBAIS
============================================= */

window.criarLoader = criarLoader;
window.criarMensagem = criarMensagemErro;
window.mostrarFeedback = mostrarFeedback;
window.mostrarErro = function(container, mensagemPrincipal, mensagemSecundaria, retryCallback, idBotao = 'tentar-novamente') {
  container.innerHTML = `
  <div class="erro-ecocommerce" role="alert" style="
      text-align:center;
      background-color: var(--branco-neve);
      color: var(--cinza-pedra);
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      margin: 1rem auto;
      max-width: 500px;
      border: 2px solid var(--verde-folha);
  ">
    <i class="fas fa-leaf" style="font-size: 32px; color: var(--verde-folha);" aria-hidden="true"></i>
    <h3 style="margin-top: 12px; color: var(--verde-folha);">${mensagemPrincipal}</h3>
    ${mensagemSecundaria ? `<p style="margin: 10px 0; color: var(--cinza-pedra);">${mensagemSecundaria}</p>` : ''}
    <button id="${idBotao}" class="btn-tentar-novamente"><i class="fa-solid fa-rotate"></i> Tentar novamente</button>
  </div>
`;

  const btn = document.getElementById(idBotao);
  if (btn) {
    btn.addEventListener('click', () => {
      container.innerHTML = criarLoader();
      setTimeout(retryCallback, 300);
    });
  }

  if (!navigator.onLine) {
    window.addEventListener("online", () => {
      retryCallback();
    }, { once: true });
  }
};
window.adicionarAoCarrinho = window.adicionarAoCarrinho || function() {
  console.error('Função não carregada!');
};

/* =============================================
  PESQUISA E FILTRAGEM POR CATEGORIAS
============================================= */
document.addEventListener('DOMContentLoaded', () => {
  inicializarProdutos();

  const inputPesquisa = document.getElementById('input-pesquisa');
  if (inputPesquisa) {
    inputPesquisa.addEventListener('input', () => {
      const termo = inputPesquisa.value.trim().toLowerCase();
      const todosProdutos = window.produtosCarregados || [];

      const filtrados = todosProdutos.filter(p =>
        p.nome.toLowerCase().includes(termo) ||
        (p.descricao && p.descricao.toLowerCase().includes(termo))
      );

      const container = document.getElementById('produtos-lista');
      if (container) {
        container.innerHTML = filtrados.length > 0
          ? renderizarProdutos(filtrados)
          : '<p style="text-align:center;">Nenhum produto encontrado.</p>';

        configurarEventosProdutos(); // importante para manter os botões funcionando
      }
    });
  }

  setupCarrinho();
  console.log('Config:', config);
});

document.addEventListener('DOMContentLoaded', () => {
  inicializarProdutos();

  const inputPesquisa = document.getElementById('input-pesquisa');
  const filtroCategoria = document.getElementById('filtro-categoria');
  const container = document.getElementById('produtos-lista');

  function aplicarFiltros() {
    const termo = inputPesquisa?.value.trim().toLowerCase() || '';
    const categoriaSelecionada = filtroCategoria?.value || '';
    const todosProdutos = window.produtosCarregados || [];

    const filtrados = todosProdutos.filter(p => {
      const correspondeBusca = p.nome.toLowerCase().includes(termo) ||
        (p.descricao && p.descricao.toLowerCase().includes(termo));

      const correspondeCategoria = categoriaSelecionada === '' || p.categoria === categoriaSelecionada;

      return correspondeBusca && correspondeCategoria;
    });

    if (container) {
      container.innerHTML = filtrados.length > 0
        ? renderizarProdutos(filtrados)
        : '<p style="text-align:center;">Nenhum produto encontrado.</p>';

      configurarEventosProdutos(); // mantém os botões de adicionar funcionando
    }
  }

  if (inputPesquisa) inputPesquisa.addEventListener('input', aplicarFiltros);
  if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltros);

  setupCarrinho();
  console.log('Config:', config);
});
