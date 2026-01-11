import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { token } = req.query;
  const { senha, confirmarSenha } = req.body;

  if (senha !== confirmarSenha) {
    return res.status(400).json({ message: 'Senhas não conferem.' });
  }

  if (!senha || !confirmarSenha) {
    return res.status(400).json({ message: 'Campos obrigatórios não preenchidos.' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');

    // Busca usuário pelo token e validade
    const user = await db.collection('usuarios').findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado.' });
    }

    // Criptografa a nova senha
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    // Atualiza a senha e remove token e validade
    await db.collection('usuarios').updateOne(
      { _id: user._id },
      {
        $set: { senha: senhaCriptografada },
        $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
      }
    );

    res.json({ message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error: error.message });
  } finally {
    await client.close();
  }
}