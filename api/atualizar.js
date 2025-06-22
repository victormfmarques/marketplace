import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await client.connect();
      const db = client.db('marketplace');
      
      // COLOQUE O CÓDIGO NOVO AQUI (começa aqui ▼)
      const { email, ...updateData } = req.body;

      // Tratamento de campos vazios
      updateData.telefone = updateData.telefone === "" ? null : updateData.telefone;
      updateData.dataNascimento = updateData.dataNascimento 
        ? new Date(updateData.dataNascimento) 
        : null;
      // termina aqui ▲

      // O resto do seu código continua igual daqui pra baixo...
      if (updateData.senha) {
        updateData.senha = await bcrypt.hash(updateData.senha, 10);
      } else {
        delete updateData.senha;
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