// js/modules/store.js

let produtos = [];

/** Retorna a lista completa de produtos carregados. */
export function getProdutos() {
    return produtos;
}

/** Define/atualiza a lista de produtos. */
export function setProdutos(novosProdutos) {
    produtos = novosProdutos;
}

/** Encontra um único produto pelo seu ID. */
export function encontrarProdutoPorId(produtoId) {
    if (!produtoId) return undefined;
    return produtos.find(p => (p.id || p._id) === produtoId);
}