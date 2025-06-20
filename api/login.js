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
        return res.status(404).json({ 
          message: 'Usuário não encontrado',
          suggestion: 'Verifique o email ou cadastre-se'
        });
      }

      // Verifica se a senha está criptografada
      const isSenhaCriptografada = usuario.senha.startsWith('$2a$');
      let senhaValida = false;
      
      if (isSenhaCriptografada) {
        senhaValida = await bcrypt.compare(senha, usuario.senha);
      } else {
        // Compatibilidade com senhas não criptografadas (apenas para desenvolvimento)
        senhaValida = senha === usuario.senha;
      }

      if (!senhaValida) {
        return res.status(401).json({ 
          message: 'Credenciais inválidas',
          suggestion: 'Verifique sua senha'
        });
      }

      // Remove a senha antes de enviar os dados do usuário
      const { senha: _, ...usuarioSemSenha } = usuario;
      
      res.status(200).json({ 
        success: true,
        message: 'Login bem-sucedido!',
        usuario: usuarioSemSenha,
        redirect: '/index.html'
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ 
        message: 'Erro interno no servidor',
        error: error.message,
        code: 'LOGIN_ERROR'
      });
    } finally {
      await client.close();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ 
      message: 'Método não permitido',
      allowedMethods: ['POST']
    });
  }
}