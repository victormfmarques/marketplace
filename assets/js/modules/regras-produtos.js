export function validarLimiteProdutos(usuario, totalProdutos) {
  const LIMITE_PADRAO = 5;

  // 1️⃣ Bloqueia quem não pode vender
  if (usuario.cargo !== 'vendedor' && usuario.cargo !== 'administrador') {
    return {
      ok: false,
      motivo: 'Você precisa ser vendedor para publicar produtos.'
    };
  }

  // 2️⃣ Administrador não tem limite
  if (usuario.cargo === 'administrador') {
    return { ok: true };
  }

  // 3️⃣ Limite para vendedor comum
  if (totalProdutos >= LIMITE_PADRAO) {
    return {
      ok: false,
      motivo: 'Você atingiu o limite de 5 produtos do seu plano.'
    };
  }

  return { ok: true };
}