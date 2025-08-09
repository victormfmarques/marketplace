import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db('marketplace');

    const limit = parseInt(req.query.limit) || 0; // Limite opcional

    const pipeline = [
  { $match: { status: 'ativo' } },
  {
    $addFields: {
      usuarioObjectId: { $toObjectId: "$usuarioId" }
    }
  },
  {
    $lookup: {
      from: 'usuarios',
      localField: 'usuarioObjectId',
      foreignField: '_id',
      as: 'usuario'
    }
  },
  { $unwind: { path: '$usuario', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      id: '$_id',
      nome: 1,
      descricao: 1,
      preco: 1,
      categoria: 1,
      fotos: 1,
      usuarioId: 1,
      visualizacoes: 1, // <-- importante!
      foto: { $arrayElemAt: ['$fotos', 0] },
      vendedor: {
        nome: '$usuario.nome',
        email: '$usuario.email',
        telefone: '$usuario.telefone'
      }
    }
  },
  { $sort: { visualizacoes: -1 } } // <-- ordena pelos mais vistos
];

// ✅ Aplica limite se informado
if (limit > 0) {
  pipeline.push({ $limit: limit });
}


    const produtos = await db.collection('produtos').aggregate(pipeline).toArray();

    const produtosFormatados = produtos.map(p => ({
      ...p,
      id: p.id.toString()
    }));

    res.status(200).json({
      success: true,
      data: produtosFormatados
    });

  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ success: false, error: 'Erro interno' });
  } finally {
    await client.close();
  }
}
