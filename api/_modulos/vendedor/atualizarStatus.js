import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const client = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { pedidoId, novoStatus } = req.body;
  // Futuramente, adicionar validação do ID do vendedor aqui por segurança

  if (!pedidoId || !novoStatus) {
    return res.status(400).json({ message: 'ID do pedido e novo status são obrigatórios.' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');
    
    const result = await db.collection('pedidos').updateOne(
      { _id: new ObjectId(pedidoId) },
      { $set: { status: novoStatus } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    res.status(200).json({ success: true, message: 'Status atualizado.' });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status do pedido.' });
  } finally {
    await client.close();
  }
}