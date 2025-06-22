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

// VALIDAÇÃO DE DATAS
const validarData = (dataString) => {
  const data = new Date(dataString);
  return !isNaN(data.getTime()) && data.getFullYear() > 1900;
};

if (updateData.dataNascimento && !validarData(updateData.dataNascimento)) {
  delete updateData.dataNascimento; // Remove se for inválida
}
if (updateData.telefone === "") {
  updateData.telefone = null; // Garante null explícito
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