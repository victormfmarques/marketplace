export function templateEmailAssociarte({
  tipo, // 'pedido' | 'cancelamento' | 'status'
  titulo,
  mensagemPrincipal,
  pedidoId,
  usuario,
  produtos,
  destaque = null
}) {
  const corHeader =
    tipo === 'cancelamento' ? '#c62828' :
    tipo === 'status' ? '#1565c0' :
    '#2e7d32';

  const blocoDestaque = destaque ? `
    <div style="
      margin-top:16px;
      padding:12px;
      background:#fbe9e7;
      border-left:4px solid #c62828;
      border-radius:4px;
    ">
      <strong>${destaque.titulo}</strong>
      <p style="margin:6px 0 0;">${destaque.texto}</p>
    </div>
  ` : '';

  return `
  <div style="
    max-width:600px;
    margin:0 auto;
    font-family:Arial, Helvetica, sans-serif;
    background:#ffffff;
    color:#333;
    border-radius:8px;
    border:1px solid #eaeaea;
    overflow:hidden;
  ">

    <!-- HEADER -->
    <div style="background:${corHeader};padding:20px;text-align:center;">
      <img 
        src="https://associarte-marketplace.vercel.app/assets/img/logo.png"
        alt="AssociArte Marketplace"
        width="160"
        style="display:block;margin:0 auto 10px;"
      />
      <h2 style="color:#fff;margin:0;">${titulo}</h2>
    </div>

    <!-- BODY -->
    <div style="padding:20px;">
      <p>${mensagemPrincipal}</p>

      <p><strong>Nº do Pedido:</strong> ${pedidoId}</p>

      <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">

      <h3>👤 Comprador</h3>
      <p><strong>Nome:</strong> ${usuario.nome}</p>
      <p><strong>Email:</strong> ${usuario.email}</p>
      <p><strong>Telefone:</strong> ${usuario.telefone || 'Não informado'}</p>

      ${blocoDestaque}

      <h3 style="margin-top:20px;">📦 Produtos</h3>
      <ul>
        ${produtos.map(p => `<li>${p.nome} (x${p.quantidade})</li>`).join('')}
      </ul>
    </div>

    <!-- FOOTER -->
    <div style="
      background:#f5f5f5;
      padding:12px;
      text-align:center;
      font-size:12px;
      color:#666;
    ">
      ASSOCIARTE Marketplace • Mensagem automática<br>
      Não responda este e-mail
    </div>

  </div>
  `;
}