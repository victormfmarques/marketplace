import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  const metodo = req.method;
  const produtoId = req.query.id;

  if (!produtoId || !ObjectId.isValid(produtoId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');

    const headerUsuario = req.headers['x-usuario'];
    if (!headerUsuario) return res.status(400).json({ error: 'Cabeçalho x-usuario ausente' });

    const usuarioLogado = JSON.parse(headerUsuario);

    const produto = await db.collection('produtos').findOne({ _id: new ObjectId(produtoId) });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });

    if (produto.usuarioId.toString() !== usuarioLogado._id) {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    // --- MÉTODO PUT: Editar produto ---
    if (metodo === 'PUT') {
      const { nome, descricao, preco, categoria } = req.body;

      if (!nome || !descricao || !preco || !categoria) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
      }

      await db.collection('produtos').updateOne(
        { _id: new ObjectId(produtoId) },
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

      return res.status(200).json({ success: true });
    }

    // --- MÉTODO DELETE: Excluir produto ---
    if (metodo === 'DELETE') {
      await db.collection('produtos').deleteOne({ _id: new ObjectId(produtoId) });
      return res.status(200).json({ success: true });
    }

    // Outros métodos não permitidos
    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('Erro na API editar/excluir:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    await client.close();
  }
}