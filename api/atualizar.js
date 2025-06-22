import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  // Verifica se o usuário está autenticado via token ou session
  const { userId, nome, sexo, dataNascimento, telefone, email, senhaAtual, novaSenha } = req.body;

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

    // Verifica se a senha atual está correta (se for alteração de senha)
    if (novaSenha) {
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ message: 'Senha atual incorreta' });
      }
    }

    // Prepara os dados para atualização
    const updateData = {
      nome: nome || usuario.nome,
      sexo: sexo || usuario.sexo,
      dataNascimento: dataNascimento || usuario.dataNascimento,
      telefone: telefone || usuario.telefone,
      email: email || usuario.email,
      ultimaAtualizacao: new Date()
    };

    // Se houver nova senha, criptografa e adiciona
    if (novaSenha) {
      updateData.senha = await bcrypt.hash(novaSenha, 10);
    }

    // Atualiza no banco de dados
    const result = await usuarios.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'Nenhum dado foi alterado' });
    }

    // Busca o usuário atualizado (sem a senha)
    const usuarioAtualizado = await usuarios.findOne(
      { _id: new ObjectId(userId) },
      { projection: { senha: 0 } }
    );

    res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      usuario: usuarioAtualizado
    });

  } catch (error) {
    console.error('Erro na atualização:', error);
    res.status(500).json({ 
      message: 'Erro interno no servidor',
      error: error.message
    });
  } finally {
    await client.close();
  }
}