import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://victor:manoelvictor14@marketplace.msyyxna.mongodb.net/marketplace?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000
});

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db('marketplace');
    const collection = db.collection('produtos');

    // Filtros
    let query = { status: 'ativo' };
    if (req.query.destaque) query.destaque = true;
    if (req.query.categoria) query.categoria = req.query.categoria;

    // Ordenação e limite
    const produtos = await collection.find(query)
      .sort({ dataCadastro: -1 })
      .limit(req.query.limit ? parseInt(req.query.limit) : 0)
      .toArray();

    // Formatação segura
    const produtosFormatados = produtos.map(p => ({
      id: p._id.toString(),
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco?.$numberDecimal ? parseFloat(p.preco.$numberDecimal) : parseFloat(p.preco || 0),
      categoria: p.categoria,
      foto: p.fotos?.[0] || '/sem-imagem.jpg',
      usuarioId: p.usuarioId
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ 
      success: true,
      data: produtosFormatados 
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno' 
    });
  } finally {
    await client.close();
  }
}