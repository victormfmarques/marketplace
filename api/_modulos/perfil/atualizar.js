import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { userId, nome, telefone, email, senha, nsenha } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');
    const usuarios = db.collection('usuarios');

    // Busca o usuário
    const usuario = await usuarios.findOne({ _id: new ObjectId(userId) });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // 🔐 VALIDA SENHA SEMPRE
    if (!senha) {
      return res.status(400).json({ message: 'Senha atual é obrigatória' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    if (
      nome === usuario.nome &&
      telefone === usuario.telefone &&
      email === usuario.email &&
      !nsenha
    ) {
      return res.status(400).json({ message: 'Nenhuma alteração detectada' });
    }

    // Dados permitidos para atualização
    const updateData = {
      nome: nome || usuario.nome,
      telefone: telefone || usuario.telefone,
      email: email || usuario.email,
      ultimaAtualizacao: new Date()
    };

    // Nova senha
    if (nsenha) {
      updateData.senha = await bcrypt.hash(nsenha, 10);
    }

    const result = await usuarios.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'Nenhum dado foi alterado' });
    }

    // Retorna usuário atualizado (sem senha)
    const usuarioAtualizado = await usuarios.findOne(
      { _id: new ObjectId(userId) },
      { projection: { senha: 0 } }
    );

    return res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      usuario: usuarioAtualizado
    });

  } catch (error) {
    console.error('Erro na atualização:', error);
    return res.status(500).json({
      message: 'Erro interno no servidor',
      error: error.message
    });
  } finally {
    await client.close();
  }
}