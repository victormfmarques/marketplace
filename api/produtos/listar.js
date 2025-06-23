import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 5, // Conexões simultâneas
  connectTimeoutMS: 5000,
  socketTimeoutMS: 30000,
};

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri, options);
  const db = client.db('marketplace');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  let client;
  
  try {
    ({ client } = await connectToDatabase());
    const db = client.db('marketplace');
    
    let query = { status: 'ativo' };
    
    if (req.query.search) {
      query.$text = { $search: req.query.search };
      // Certifique-se de ter criado o índice de texto no MongoDB:
      // db.produtos.createIndex({ nome: "text", descricao: "text" })
    }
    
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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}