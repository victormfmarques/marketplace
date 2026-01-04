import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  // Verifica se email e senha foram enviados
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');
    const usuario = await db.collection('usuarios').findOne({ email });

    // Verifica se o usuário existe
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuário não encontrado',
        suggestion: 'Verifique o email ou cadastre-se'
      });
    }

    // Verifica se a senha está correta
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ 
        message: 'Senha incorreta',
        suggestion: 'Tente novamente ou redefina sua senha'
      });
    }

    // Remove a senha antes de enviar a resposta
    const { senha: _, ...usuarioSemSenha } = usuario;
    
    const token = jwt.sign(
      {
        id: usuario._id,
        email: usuario.email,
        cargo: usuario.cargo || 'usuario'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Login bem-sucedido
    res.status(200).json({ 
      success: true,
      message: 'Login realizado com sucesso!',
      usuario: usuarioSemSenha,token,
      redirect: '/index.html'
    });

  } catch (error) {
    console.error('🔴 ERRO NO LOGIN:', error);
    res.status(500).json({ 
      message: 'Erro interno no servidor',
      error: error.message,
      code: 'LOGIN_FAILED'
    });
  } finally {
    await client.close();
  }
}