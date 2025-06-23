import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10, // Aumentado para melhor performance
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 10000
};

// Cache de conexão melhorado
let client;
let db;

async function connectToDatabase() {
  if (db) return db;
  
  client = new MongoClient(uri, options);
  await client.connect();
  db = client.db('marketplace');
  
  // Cria índices se não existirem
  await db.collection('produtos').createIndex({ nome: "text", descricao: "text" });
  await db.collection('produtos').createIndex({ status: 1 });
  await db.collection('produtos').createIndex({ categoria: 1 });
  await db.collection('produtos').createIndex({ dataCadastro: -1 });
  
  return db;
}

export default async function handler(req, res) {
  try {
    const database = await connectToDatabase();
    
    // Configuração base da query
    let query = { status: 'ativo' };
    let sort = { dataCadastro: -1 };
    let limit = 0; // 0 = sem limite
    let projection = {};
    
    // Filtros
    if (req.query.search) {
      query.$text = { $search: req.query.search };
      projection.score = { $meta: "textScore" };
      sort = { score: { $meta: "textScore" } };
    }
    
    if (req.query.categoria) {
      query.categoria = { $regex: new RegExp(req.query.categoria, 'i') };
    }
    
    // Controle de paginação
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 12;
    const skip = (page - 1) * perPage;
    
    // Destaques (mais vendidos/visualizados)
    if (req.query.destaque === 'true') {
      sort = { visualizacoes: -1 };
      limit = 4;
    }
    
    // Novidades
    if (req.query.novidades === 'true') {
      sort = { dataCadastro: -1 };
      limit = 8;
    }
    
    // Consulta ao MongoDB
    const [produtos, total] = await Promise.all([
      database.collection('produtos')
        .find(query, { projection })
        .sort(sort)
        .skip(skip)
        .limit(limit || perPage)
        .toArray(),
        
      database.collection('produtos')
        .countDocuments(query)
    ]);
    
    // Formatação dos dados
    const produtosFormatados = produtos.map(formatarProduto);
    
    // Resposta padronizada
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    console.log('DEBUG - Produtos encontrados:', produtosFormatados);
    console.log('DEBUG - Query executada:', query);
    res.status(200).json({
      success: true,
      data: {
        produtos: produtosFormatados,
        paginacao: {
          total,
          paginaAtual: page,
          porPagina: perPage,
          totalPaginas: Math.ceil(total / perPage)
        },
        filtros: {
          search: req.query.search,
          categoria: req.query.categoria
        }
      }
    });
    
  } catch (error) {
    console.error('Erro no listar.js:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      error: 'Erro interno no servidor',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : null
    });
  }
}

// Função auxiliar para formatação consistente
function formatarProduto(produto) {
  // Conversão segura do preço
  let preco = 0;
  try {
    preco = parseFloat(
      (produto.price || produto.preco || '0')
        .toString()
        .replace(',', '.')
        .replace(/[^0-9.]/g, '')
    );
  } catch (e) {
    console.error(`Erro ao converter preço do produto ${produto._id}:`, e);
  }
  
  return {
    _id: produto._id,
    nome: produto.name || produto.nome || 'Produto sem nome',
    descricao: produto.describe || produto.descricao || '',
    preco: preco,
    categoria: (produto.categoría || produto.categoria || 'outros')
               .replace(',', '')
               .trim(),
    fotos: Array.isArray(produto.fotos) ? 
           produto.fotos.filter(foto => typeof foto === 'string') : 
           [],
    usuarioId: produto.usuarioId || null,
    dataCadastro: produto.dataCadastro || new Date(),
    visualizacoes: produto.visualizacoes || 0,
    avaliacao: produto.avaliacao || 0
  };
}