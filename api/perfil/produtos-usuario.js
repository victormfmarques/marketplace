import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db('marketplace');

    const { usuarioId } = req.query;
    if (!usuarioId || !ObjectId.isValid(usuarioId)) {
      return res.status(400).json({ error: 'Usuário inválido' });
    }

    const produtos = await db.collection('produtos')
      .find({ usuarioId: usuarioId, status: 'ativo' })
      .toArray();

    res.status(200).json({ success: true, data: produtos });

  } catch (error) {
    console.error('Erro ao buscar produtos do usuário:', error);
    res.status(500).json({ success: false, error: 'Erro interno' });
  } finally {
    await client.close();
  }
}