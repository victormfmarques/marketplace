import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { nome, email, senha, telefone } = req.body;

  // Validações básicas no backend (importante!)
  if (!nome || !email || !senha) {
    return res.status(400).json({ message: 'Dados obrigatórios não informados' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');

    // Verifica se email já existe
    const usuarioExistente = await db
      .collection('usuarios')
      .findOne({ email });

    if (usuarioExistente) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criptografa a senha
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    // Cria o usuário
    const novoUsuario = {
      nome,
      email,
      senha: senhaCriptografada,
      telefone: telefone || '',
      cargo: 'comprador',
      dataCadastro: new Date()
    };

    const result = await db
      .collection('usuarios')
      .insertOne(novoUsuario);

    return res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      usuario: {
        _id: result.insertedId,
        nome,
        email,
        telefone,
        cargo: 'comprador'
      },
      redirect: '/index.html'
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    return res.status(500).json({
      message: 'Erro no servidor',
      error: error.message
    });
  } finally {
    await client.close();
  }
}