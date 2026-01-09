// js/modules/utils.js

/**
 * Formata um número de telefone nos padrões (XX) XXXX-XXXX ou (XX) XXXXX-XXXX.
 * @param {string} telefone - O número de telefone a ser formatado.
 * @returns {string} O telefone formatado.
 */
export function formatarTelefone(telefone) {
  if (!telefone) return '';
  const apenasNumeros = telefone.replace(/\D/g, '');

  if (apenasNumeros.length === 10) {
    return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 6)}-${apenasNumeros.substring(6)}`;
  } else if (apenasNumeros.length === 11) {
    return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 7)}-${apenasNumeros.substring(7)}`;
  }

  return telefone; // Retorna o original se não corresponder
}

import { perfilAPI } from './api.js';

/**
 * Verifica a sessão do usuário com o servidor e atualiza o localStorage se necessário.
 * Retorna os dados do usuário mais recentes.
 * @returns {Promise<object|null>} O objeto do usuário atualizado ou null.
 */
export async function verificarEAtualizarSessao() {
    const usuarioLocal = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLocal?._id) {
        // Se não há usuário ou ID no localStorage, não há o que verificar.
        return null;
    }

    try {
        const data = await perfilAPI.verificarSessao(usuarioLocal._id);
        
        if (JSON.stringify(usuarioLocal) !== JSON.stringify(data.usuario)) {
            console.log('Sessão desatualizada. Atualizando localStorage...');
            localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
            
            // Dispara um evento para notificar outras partes da aplicação (opcional, mas bom)
            window.dispatchEvent(new CustomEvent('sessaoAtualizada', { detail: data.usuario }));

            return data.usuario; // Retorna os dados frescos
        }
        
        return usuarioLocal; // Retorna os dados locais, pois estão atualizados

    } catch (error) {
        console.error('Falha ao verificar sessão. Usando dados locais para evitar quebrar o site.', error);
        // Em caso de erro (ex: offline), confia nos dados locais para não deslogar o usuário.
        return usuarioLocal;
    }
}

export function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

// Retorna apenas os dois primeiros nomes
export function pegarDoisPrimeirosNomes(nomeCompleto = '') {
    return nomeCompleto
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join(' ');
}


/**
 * Retorna a URL da primeira foto válida de um produto,
 * ou placeholder caso não haja foto.
 * @param {Object} prod - Produto
 * @returns {string} URL da foto
 */
export function pegarFotoProduto(prod) {
    if (!prod || !prod.fotos) return '/assets/img/placeholder.png';

    if (Array.isArray(prod.fotos)) {
        const primeiraFoto = prod.fotos.find(f => {
            if (!f) return false;
            if (typeof f === 'string') return f.trim() !== '';
            if (typeof f === 'object' && f.url) return f.url.trim() !== '';
            return false;
        });

        if (primeiraFoto) {
            if (typeof primeiraFoto === 'string') {
                return primeiraFoto.startsWith('http')
                    ? primeiraFoto
                    : `https://res.cloudinary.com/ddfacpcm5/image/upload/${primeiraFoto}`;
            } else if (typeof primeiraFoto === 'object' && primeiraFoto.url) {
                return primeiraFoto.url.startsWith('http')
                    ? primeiraFoto.url
                    : `https://res.cloudinary.com/ddfacpcm5/image/upload/${primeiraFoto.url}`;
            }
        }
    }

    return '/assets/img/placeholder.png';
}

export function imageToCompressedBase64(file, maxSize = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();

    reader.onload = () => (img.src = reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const scale = Math.min(
        maxSize / img.width,
        maxSize / img.height,
        1
      );

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const base64 = canvas.toDataURL('image/jpeg', quality);
      resolve(base64);
    };

    img.onerror = reject;
  });
}