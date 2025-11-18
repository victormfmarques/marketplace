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
