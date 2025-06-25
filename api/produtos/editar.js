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

    const headerUsuario = req.headers['x-usuario'];
    if (!headerUsuario) return res.status(400).json({ error: 'Cabeçalho x-usuario ausente' });

    const usuarioLogado = JSON.parse(headerUsuario);

    if (!req.query.id || !ObjectId.isValid(req.query.id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const produto = await db.collection('produtos').findOne({
      _id: new ObjectId(req.query.id)
    });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    if (produto.usuarioId.toString() !== usuarioLogado._id) {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    const { nome, descricao, preco, categoria } = req.body;

    if (!nome || !descricao || !preco || !categoria) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    await db.collection('produtos').updateOne(
      { _id: new ObjectId(req.query.id) },
      {
        $set: {
          nome,
          descricao,
          preco,
          categoria,
          dataAtualizacao: new Date()
        }
      }
    );

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro na API editar.js:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}
