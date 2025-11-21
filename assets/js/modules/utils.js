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