import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db('marketplace');
    
    const produtos = await db.collection('produtos')
      .find({ status: 'ativo' })
      .sort({ dataCadastro: -1 })
      .toArray();

    res.status(200).json({ produtos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}

if (req.query.search) {
  produtos = await db.collection('produtos')
    .find({ 
      status: 'ativo',
      $text: { $search: req.query.search } 
    })
    .toArray();
}