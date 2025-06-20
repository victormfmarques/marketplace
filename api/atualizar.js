import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await client.connect();
      const db = client.db('marketplace');
      
      const { email, ...updateData } = req.body;
      
      // Se senha foi enviada, criptografa
      if (updateData.senha) {
        updateData.senha = await bcrypt.hash(updateData.senha, 10);
      } else {
        delete updateData.senha;
      }

      const result = await db.collection('usuarios').updateOne(
        { email },
        { $set: updateData }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({ message: 'Nenhum dado foi alterado' });
      }

      const usuarioAtualizado = await db.collection('usuarios').findOne({ email });
      const { senha, ...usuarioSemSenha } = usuarioAtualizado;

      res.status(200).json({ 
        message: 'Perfil atualizado!',
        usuario: usuarioSemSenha
      });

    } catch (error) {
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Método não permitido' });
  }
}