import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { nome, email, senha } = req.body;

    try {
      await client.connect();
      const db = client.db('marketplace');
      const usuarioExistente = await db.collection('usuarios').findOne({ email });

      if (usuarioExistente) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      const senhaCriptografada = await bcrypt.hash(senha, 10);
      const novoUsuario = { nome, email, senha: senhaCriptografada };
      await db.collection('usuarios').insertOne(novoUsuario);

      res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Método não permitido' });
  }
}