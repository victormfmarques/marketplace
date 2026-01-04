// js/modules/ui.js

/**
 * Mostra uma mensagem de feedback temporária na tela.
 * @param {string} mensagem - O texto a ser exibido.
 * @param {'sucesso'|'erro'|'aviso'} tipo - O tipo de feedback.
 * @param {number} tempo - Duração em milissegundos.
 */
export function mostrarFeedback(mensagem, tipo = 'sucesso', tempo = 3000) {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;

  feedback.textContent = mensagem;
  feedback.className = 'feedback'; // Reseta as classes
  feedback.classList.add(tipo);

  // Força o navegador a reconhecer a mudança para a animação funcionar
  void feedback.offsetWidth;

  feedback.classList.add('show');

  clearTimeout(feedback._hideTimeout);
  feedback._hideTimeout = setTimeout(() => {
    feedback.classList.remove('show');
  }, tempo);
}

/**
 * Gera o HTML para um ícone de carregamento (loader).
 * @param {string} texto - Texto a ser exibido abaixo do loader.
 * @returns {string} O HTML do loader.
 */
export function criarLoader(texto = "Carregando...") {
  return `
    <div class="loader-container" role="status" aria-live="polite" style="text-align:center; padding:2rem;">
      <div class="loader-spinner" style="border: 6px solid #FFFFFF; border-top: 6px solid #3A6351; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem auto;"></div>
      <p>${texto}</p>
    </div>
  `;
}

/**
 * Gera o HTML para uma mensagem de erro ou aviso com um botão opcional.
 * @param {string} texto - O texto principal da mensagem.
 * @param {'erro'|'aviso'|'info'} tipo - O tipo de mensagem.
 * @param {string|null} btnId - O ID para o botão de "tentar novamente".
 * @param {string} btnTexto - O texto para o botão.
 * @returns {string} O HTML da mensagem.
 */
export function criarMensagemErro(texto, tipo = 'erro', btnId = null, btnTexto = '<i class="fa-solid fa-rotate"></i> Tentar novamente') {
  return `
    <div class="erro-ecocommerce" role="alert" style="text-align:center; background-color: #FFFFFF; color: #4F4F4F; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); margin: 1rem auto; max-width: 500px; border: 2px solid #3A6351;">
      <i class="fas fa-${tipo === 'erro' ? 'leaf' : 'info-circle'}" style="font-size: 32px; color: #3A6351;" aria-hidden="true"></i>
      <h3 style="margin-top: 12px; color: #3A6351;">${texto}</h3>
      ${btnId ? `<button id="${btnId}" class="btn-tentar-novamente">${btnTexto}</button>` : ''}
    </div>
  `;
}

/**
 * Renderiza uma mensagem de erro completa em um container, com lógica de "tentar novamente".
 * @param {HTMLElement} container - O elemento onde o erro será renderizado.
 * @param {string} mensagemPrincipal - O título do erro.
 * @param {string} mensagemSecundaria - Um texto de apoio.
 * @param {Function} retryCallback - A função a ser chamada ao clicar em "Tentar novamente".
 * @param {string} idBotao - O ID para o botão.
 */
export function mostrarErro(container, mensagemPrincipal, mensagemSecundaria, retryCallback, idBotao = 'tentar-novamente') {
  container.innerHTML = `
    <div class="erro-ecocommerce" role="alert" style="text-align:center; background-color: #FFFFFF; color: #4F4F4F; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); margin: 1rem auto; max-width: 500px; border: 2px solid #3A6351;">
      <i class="fas fa-leaf" style="font-size: 32px; color: #3A6351;" aria-hidden="true"></i>
      <h3 style="margin-top: 12px; color: #3A6351;">${mensagemPrincipal}</h3>
      ${mensagemSecundaria ? `<p style="margin: 10px 0; color: #4F4F4F;">${mensagemSecundaria}</p>` : ''}
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
}

export function previewImagens(input, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  Array.from(input.files).forEach(file => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '500px';
      img.style.marginRight = '8px';
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

export function renderizarPreviewFotos(containerId, fotos, opcoes = {}) {
  const {
    titulo = '',
    icone = 'fa-image',
    classeImagem = 'preview-img'
  } = opcoes;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  if (titulo) {
    const tituloEl = document.createElement('div');
    tituloEl.classList.add('preview-titulo');
    tituloEl.innerHTML = `<i class="fa-solid ${icone}"></i> ${titulo}`;
    container.appendChild(tituloEl);
  }

  fotos.forEach((foto) => {
    const img = document.createElement('img');
    img.src = foto;
    img.classList.add(classeImagem, 'preview-animada');
    container.appendChild(img);
  });
}

export function previewImagensInput(inputFile, containerId, options = {}) {
  if (!inputFile) return;

  inputFile.addEventListener('change', () => {
    if (!inputFile.files.length) return;

    const file = inputFile.files[0];
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      renderizarPreviewFotos(containerId, [e.target.result], options);
    };

    reader.readAsDataURL(file);
  });
}
