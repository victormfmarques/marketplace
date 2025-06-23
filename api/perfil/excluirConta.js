import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { userId, senha } = req.body;

  if (!userId || !senha) {
    return res.status(400).json({ message: 'ID do usuário e senha são obrigatórios' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');
    const usuarios = db.collection('usuarios');

    // Verifica o usuário e a senha
    const usuario = await usuarios.findOne({ _id: new ObjectId(userId) });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    // Exclui o usuário
    const result = await usuarios.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return res.status(400).json({ message: 'Nenhum usuário foi excluído' });
    }

    res.status(200).json({ 
      success: true,
      message: 'Conta excluída com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    res.status(500).json({ 
      message: 'Erro interno no servidor',
      error: error.message
    });
  } finally {
    await client.close();
  }
}