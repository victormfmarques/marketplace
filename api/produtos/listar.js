import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 10000
};

let client;
let db;

async function connectToDatabase() {
  if (db) return db;
  
  try {
    client = new MongoClient(uri, options);
    await client.connect();
    db = client.db('marketplace');
    
    console.log('Conexão com o banco estabelecida com sucesso');
    return db;
  } catch (error) {
    console.error('Erro ao conectar ao banco:', error);
    throw new Error('Falha na conexão com o banco de dados');
  }
}

export default async function handler(req, res) {
  try {
    const database = await connectToDatabase();
    
    // Query básica - versão simplificada para testes
    const query = { status: 'ativo' };
    console.log('Query sendo executada:', query);

    const produtos = await database.collection('produtos')
      .find(query)
      .sort({ dataCadastro: -1 })
      .limit(10)
      .toArray();

    console.log('Produtos encontrados (raw):', produtos);

    if (!produtos || produtos.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          produtos: [],
          message: 'Nenhum produto encontrado'
        }
      });
    }

    // Formatação segura dos produtos
    const produtosFormatados = produtos.map(produto => {
      let preco = 0;
      
      try {
        // Converte tanto "15.99" quanto "15,99" para número
        const precoString = String(produto.preco || '0')
          .replace(/[^\d,.-]/g, '')  // Remove caracteres não numéricos
          .replace(',', '.');        // Substitui vírgula por ponto

        preco = parseFloat(precoString);
        
        if (isNaN(preco)) {
          console.warn(`Preço inválido para produto ${produto._id}:`, produto.preco);
          preco = 0;
        }
      } catch (e) {
        console.error(`Erro ao converter preço:`, e);
      }

      return {
        _id: produto._id,
        nome: produto.nome || 'Sem nome',
        descricao: produto.descricao || '',
        preco: preco,
        categoria: produto.categoria || 'geral',
        fotos: Array.isArray(produto.fotos) ? produto.fotos : [],
        usuarioId: produto.usuarioId || null,
        dataCadastro: produto.dataCadastro || new Date()
      };
    });

    console.log('Produtos formatados:', produtosFormatados);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      success: true,
      data: {
        produtos: produtosFormatados
      }
    });

  } catch (error) {
    console.error('Erro completo:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date()
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