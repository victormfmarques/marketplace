import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
  let client;
  
  try {
    // 1. Conecta ao banco
    client = new MongoClient(uri, { 
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000
    });
    await client.connect();

    // 2. Consulta DIRETA sem filtros complexos
    const produtos = await client.db('marketplace')
      .collection('produtos')
      .find({ status: "ativo" })
      .limit(10)
      .toArray();

    // 3. Formatação À PROVA DE ERROS
    const resposta = produtos.map(p => ({
      _id: p._id,
      nome: p.nome || "Sem nome",
      preco: typeof p.preco === 'string' 
        ? parseFloat(p.preco.replace(',', '.')) || 0 
        : p.preco || 0,
      fotos: Array.isArray(p.fotos) ? p.fotos : []
    }));

    // 4. Retorno SIMPLES
    res.status(200).json({ produtos: resposta });

  } catch (error) {
    console.error("ERRO CRÍTICO:", error);
    res.status(500).json({ 
      error: "Erro interno",
      detalhes: process.env.NODE_ENV === 'development' ? error.message : null
    });
  } finally {
    if (client) await client.close();
  }
}