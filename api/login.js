import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, senha } = req.body;

    try {
      await client.connect();
      const db = client.db('marketplace');
      const usuario = await db.collection('usuarios').findOne({ email });

      if (!usuario) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ message: 'Senha incorreta' });
      }

      res.status(200).json({ message: 'Login bem-sucedido!', usuario: { nome: usuario.nome, email: usuario.email } });
    } catch (error) {
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Método não permitido' });
  }
}