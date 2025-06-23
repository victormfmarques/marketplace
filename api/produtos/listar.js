import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 5,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 5000
};

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, options);
  await client.connect();
  const db = client.db('marketplace');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();
    
    let query = { status: 'ativo' };
    
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    if (req.query.categoria) {
      query.categoria = req.query.categoria;
    }

    const produtos = await db.collection('produtos')
      .find(query)
      .sort({ dataCadastro: -1 })
      .toArray();

    // Formata os dados para o frontend
    console.log('Dados recebidos:', data);
    const produtosFormatados = produtos.map(produto => ({
      nome: produto.name || produto.nome,
      descricao: produto.describe || produto.descricao,
      preco: parseFloat((produto.price || produto.preco).toString().replace(',', '')),
      categoria: (produto.categoría || produto.categoria).replace(',', ''),
      fotos: produto.fotos || [],
      _id: produto._id
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ produtos: produtosFormatados });
    
  } catch (error) {
    console.error('Erro detalhado:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    
    res.status(500).json({ 
      error: 'Erro interno no servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
}