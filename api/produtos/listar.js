import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');

    let query = { status: 'ativo' };

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const produtos = await db.collection('produtos')
      .find(query)
      .sort({ dataCadastro: -1 })
      .toArray();

    res.status(200).json({ produtos });

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}
