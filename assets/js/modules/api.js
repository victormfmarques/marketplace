// js/modules/api.js

/**
 * Função base para fazer requisições à nossa API.
 * @param {string} endpoint - A rota específica da API (ex: 'perfil/login').
 * @param {object} options - As opções para a função fetch (method, headers, body).
 * @returns {Promise<any>} Os dados da resposta em JSON.
 */
async function request(endpoint, options = {}) {
  const url = `/api?rota=${endpoint}`;
  const token = localStorage.getItem('token');

  const headers = {
    ...(options.headers || {}),
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data = null;

  // 🔒 Blindagem contra respostas não-JSON
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      throw new Error('Resposta inválida do servidor');
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Erro HTTP ${response.status}`
    );
  }

  return data;
}

// --- MÓDULO DE AUTENTICAÇÃO ---
export const authAPI = {
    login: (email, senha) => request('perfil/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    }),
    cadastrar: (usuario) => request('perfil/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario)
    })
};

// --- MÓDULO DE PRODUTOS ---
export const produtosAPI = {
    // Adiciona um parâmetro opcional para filtros (como ?limit=8)
    listar: (queryParams = '') => request(`produtos/listar&${queryParams}`),
    
    detalhes: (id) => request(`produtos/detalhes&id=${id}`),
    listarPorUsuario: (usuarioId) => request(`perfil/produtos-usuario&usuarioId=${usuarioId}`),
    // Adicionar aqui 'cadastrar', 'editar', 'excluir' no futuro...

    criar: (dados) => request('produtos/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    })
};

// --- MÓDULO DE PEDIDOS ---
export const pedidosAPI = {
    registrar: (pedido) => request('perfil/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
    }),
    listar: (usuarioId) => request(`perfil/pedidos&usuarioId=${usuarioId}`),
    cancelar: (dadosCancelamento) => request('perfil/cancelarPedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosCancelamento)
    })
};

// --- MÓDULO DE PERFIL ---
export const perfilAPI = {
    atualizar: (dadosFormulario) => request('perfil/atualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosFormulario)
    }),
    excluir: (dadosExclusao) => request('perfil/excluirConta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosExclusao)
    }),
    verificarSessao: (userId) => request(`perfil/verificarSessao&userId=${userId}`),
};

// --- MÓDULO DE ADMIN ---
export const adminAPI = {
    listarUsuarios: (adminId) => request(`admin/listarUsuarios&adminId=${adminId}`),
    mudarCargo: (adminId, targetUserId, novoCargo) => request('admin/mudarCargo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, targetUserId, novoCargo })
    }),
    excluirUsuario: (adminId, targetUserId) => request('admin/excluirUsuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, targetUserId })
    }),
    atualizarUsuario: (adminId, targetUserId, novosDados) => request('admin/atualizarUsuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, targetUserId, novosDados })
    })
};

// --- MÓDULO DE VENDEDOR ---
export const vendedorAPI = {
    getPerfil: (vendedorId) => request(`vendedor/perfil&vendedorId=${vendedorId}`),
    atualizarVendedor: (formData) => request('vendedor/atualizarVendedor', {
        method: 'POST',
        body: formData // Não definimos Content-Type, o navegador faz isso por nós
    }),
    listarPedidos: (vendedorId, pagina, status, signal) => 
        request(`vendedor/listarPedidos&id=${vendedorId}&pagina=${pagina}&status=${status}`, { signal }),
    
    atualizarStatusPedido: (pedidoId, novoStatus) => request('vendedor/atualizarStatus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId, novoStatus })
    }),
};