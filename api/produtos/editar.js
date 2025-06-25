// editar.js
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');
    const usuarioLogado = JSON.parse(req.headers['x-usuario']);

    const produto = await db.collection('produtos').findOne({
      _id: new ObjectId(req.query.id)
    });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    if (produto.usuarioId !== usuarioLogado._id) {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    await db.collection('produtos').updateOne(
      { _id: new ObjectId(req.query.id) },
      { $set: {
          name: req.body.nome,
          describe: req.body.descricao,
          price: req.body.preco,
          categoria: req.body.categoria,
          dataAtualizacao: new Date()
        }
      }
    );

    res.status(200).json({ success: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}