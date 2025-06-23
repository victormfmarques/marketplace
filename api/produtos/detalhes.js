import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 5,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 30000
};

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri, options);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  let client;
  
  try {
    client = await connectToDatabase();
    const db = client.db('marketplace');

    // Verifica se o ID é válido
    if (!ObjectId.isValid(req.query.id)) {
      return res.status(400).json({ error: 'ID do produto inválido' });
    }

    const produto = await db.collection('produtos')
      .findOne({ _id: new ObjectId(req.query.id) });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Formatação robusta dos dados
    const produtoFormatado = {
      _id: produto._id,
      nome: produto.name || produto.nome || 'Produto sem nome',
      descricao: produto.describe || produto.descricao || 'Sem descrição',
      preco: parseFloat(
        (produto.price || produto.preco || 0)
          .toString()
          .replace(',', '.')
          .replace(/[^0-9.]/g, '')
      ),
      fotos: Array.isArray(produto.fotos) ? produto.fotos : ['/placeholder.jpg'],
      usuarioId: produto.usuarioId || null,
      categoria: produto.categoría || produto.categoria || 'geral'
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(produtoFormatado);

  } catch (error) {
    console.error('Erro na API detalhes:', error);
    res.status(500).json({ 
      error: 'Erro interno no servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  } finally {
    // Não fechamos a conexão para reutilização
  }
}