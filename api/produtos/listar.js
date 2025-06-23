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

    // DEBUG: Verifique os dados brutos do MongoDB
    console.log('Produtos do MongoDB:', produtos);

    // Formatação robusta dos dados
    const produtosFormatados = produtos.map(produto => {
      // Verifica e converte o preço
      let preco = 0;
      try {
        preco = parseFloat(
          (produto.price || produto.preco || '0')
            .toString()
            .replace(',', '.')
            .replace(/[^0-9.]/g, '')
        );
      } catch (e) {
        console.error('Erro ao converter preço:', e);
      }

      return {
        _id: produto._id,
        nome: produto.name || produto.nome || 'Produto sem nome',
        descricao: produto.describe || produto.descricao || '',
        preco: preco,
        categoria: (produto.categoría || produto.categoria || 'outros').replace(',', ''),
        fotos: Array.isArray(produto.fotos) ? produto.fotos : [],
        usuarioId: produto.usuarioId || null
      };
    });

    // DEBUG: Verifique os dados formatados
    console.log('Produtos formatados:', produtosFormatados);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ 
      success: true,
      produtos: produtosFormatados 
    });
    
  } catch (error) {
    console.error('Erro detalhado:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno no servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : null,
      produtos: [] // Garante que sempre retorne um array
    });
  }
}