import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();
const client = new MongoClient(process.env.MONGODB_URI);

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await client.connect();
      const db = client.db('marketplace');

      const { usuarioId } = req.query;
      const pedidos = await db.collection('pedidos')
        .find({ usuarioId: new ObjectId(usuarioId) })
        .sort({ dataPedido: -1 })
        .toArray();

      res.status(200).json(pedidos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pedidos' });
    } finally {
      await client.close();
    }
  }

  else if (req.method === 'POST') {
    console.log('🔔 POST recebido para registrar pedido');

    try {
      await client.connect();
      const db = client.db('marketplace');

      const { usuarioId, produtos, total } = req.body;

      const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(usuarioId) });
      if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado' });

      // Verifica se os produtos têm o campo vendedorEmail
      const produtosCorrigidos = produtos.map(produto => {
        if (!produto.vendedorEmail && produto.vendedor?.email) {
          produto.vendedorEmail = produto.vendedor.email;
        }
        return produto;
      });

      const pedido = {
        usuarioId: new ObjectId(usuarioId),
        produtos: produtosCorrigidos,
        total,
        dataPedido: new Date(),
        status: 'pendente'
      };

      const result = await db.collection('pedidos').insertOne(pedido);

      // Notificar os vendedores
      const emailsNotificados = new Set();

      for (const produto of produtosCorrigidos) {
        if (produto.vendedorEmail && !emailsNotificados.has(produto.vendedorEmail)) {
          emailsNotificados.add(produto.vendedorEmail);

          try {
            await transporter.sendMail({
              from: `"EcoMarket Samavi" <${process.env.EMAIL_SENDER}>`,
              to: produto.vendedorEmail,
              subject: 'Novo pedido no EcoMarket Samavi',
              html: `
                <p>Você recebeu um novo pedido!</p>
                <p><strong>Nº do Pedido:</strong> ${pedidoId}</p>
                <p><strong>Comprador:</strong> ${usuario.nome}</p>
                <p><strong>Email:</strong> ${usuario.email}</p>
                <p><strong>Telefone:</strong> ${usuario.telefone}</p>
                <p><strong>Produtos vendidos por você:</strong></p>
                <ul>
                  ${produtosCorrigidos
                    .filter(p => p.vendedorEmail === produto.vendedorEmail)
                    .map(p => `<li>${p.nome} - Quantidade: ${p.quantidade}</li>`)
                    .join('')}
                </ul>
              `,
            });

            console.log(`📨 E-mail enviado para ${produto.vendedorEmail}`);
          } catch (erroEnvio) {
            console.error(`❌ Erro ao enviar e-mail para ${produto.vendedorEmail}:`, erroEnvio);
          }
        }
      }

      res.status(201).json({ success: true, pedidoId: result.insertedId });

    } catch (error) {
      console.error('❌ Erro ao registrar pedido:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      await client.close();
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}