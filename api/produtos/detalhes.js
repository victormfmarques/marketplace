// detalhes.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db('marketplace');
    
    const produto = await db.collection('produtos')
      .findOne({ _id: new ObjectId(req.query.id) });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.status(200).json({
      ...produto,
      nome: produto.name || produto.nome,
      descricao: produto.describe || produto.descricao,
      preco: parseFloat(produto.price || produto.preco)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}