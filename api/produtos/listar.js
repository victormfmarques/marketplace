import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db('marketplace');
    
    let query = { status: 'ativo' };
    
    // Adiciona busca textual se existir
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Adiciona filtro por categoria se existir
    if (req.query.categoria) {
      query.categoria = req.query.categoria;
    }

    const produtos = await db.collection('produtos')
      .find(query)
      .sort({ dataCadastro: -1 })
      .toArray();

    res.status(200).json({ produtos });
    
  } catch (error) {
    console.error('Erro no listar.js:', error);
    res.status(500).json({ 
      error: 'Erro interno no servidor',
      details: error.message 
    });
  } finally {
    await client.close();
  }
}