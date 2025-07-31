import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt'; 

dotenv.config();
const client = new MongoClient(process.env.MONGODB_URI);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: `Método ${req.method} não permitido` });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');

    // Recebe dados do frontend
    const { pedidoId, motivo, usuarioId, email, senha } = req.body;

    // 1. Buscar usuário pelo email para validação da senha
    const usuario = await db.collection('usuarios').findOne({ email });

    if (!usuario) {
      return res.status(401).json({ success: false, message: "Usuário não encontrado." });
    }

    // 2. Comparar senha enviada com hash do banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ success: false, message: "Senha incorreta." });
    }

    // 3. Buscar pedido validando que pertence ao usuário (com _id e usuarioId)
    const pedido = await db.collection('pedidos').findOne({
      _id: new ObjectId(pedidoId),
      usuarioId: new ObjectId(usuarioId),
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido não encontrado ou você não tem permissão para cancelá-lo.",
      });
    }

    // 4. Atualizar status do pedido para cancelado
    const result = await db.collection('pedidos').updateOne(
      { _id: new ObjectId(pedidoId) },
      {
        $set: {
          status: "cancelado",
          motivoCancelamento: motivo || "Motivo não informado",
          dataCancelamento: new Date(),
        },
      }
    );

    if (result.modifiedCount !== 1) {
      return res.status(400).json({
        success: false,
        message: "Pedido já cancelado ou não pôde ser atualizado.",
      });
    }

    // 5. Notificar vendedores via e-mail (agrupando para evitar duplicidade)
    const emailsNotificados = new Set();

    for (const produto of pedido.produtos) {
      if (produto.vendedorEmail && !emailsNotificados.has(produto.vendedorEmail)) {
        emailsNotificados.add(produto.vendedorEmail);

        try {
          await transporter.sendMail({
            from: `"EcoMarket Samavi" <${process.env.EMAIL_SENDER}>`,
            to: produto.vendedorEmail,
            subject: 'Pedido cancelado - EcoMarket Samavi',
            html: `
              <p>Um pedido foi cancelado:</p>
              <p><strong>Nº do Pedido:</strong> ${pedidoId}</p>
              <p><strong>Motivo:</strong> ${motivo || "Não informado"}</p>
              <p><strong>Produtos afetados:</strong></p>
              <ul>
                ${pedido.produtos
                  .filter(p => p.vendedorEmail === produto.vendedorEmail)
                  .map(p => `<li>${p.nome} (x${p.quantidade})</li>`)
                  .join('')}
              </ul>
              <p>Entre em contato com o cliente para mais detalhes.</p>
            `,
          });
          console.log(`📨 E-mail de cancelamento enviado para ${produto.vendedorEmail}`);
        } catch (erroEnvio) {
          console.error(`❌ Falha ao notificar ${produto.vendedorEmail}:`, erroEnvio);
        }
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Erro no cancelamento:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await client.close();
  }
}
