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
      const usuarios = db.collection('usuarios');

      const usuario = await usuarios.findOne({ email });

      if (!usuario) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const isSenhaCriptografada = usuario.senha.startsWith('$2a$');
      let senhaValida = false;

      if (isSenhaCriptografada) {
        senhaValida = await bcrypt.compare(senha, usuario.senha);
      } else {
        senhaValida = senha === usuario.senha;
      }

      if (!senhaValida) {
        return res.status(401).json({ message: 'Senha incorreta' });
      }

      // 🔥 Se senha não estava criptografada, criptografa e atualiza no banco:
      if (!isSenhaCriptografada) {
        const senhaCriptografada = await bcrypt.hash(senha, 10);
        await usuarios.updateOne(
          { email },
          { $set: { senha: senhaCriptografada } }
        );
        console.log('Senha antiga atualizada para criptografada');
      }

      const { senha: _, ...usuarioSemSenha } = usuario;

      res.status(200).json({
        success: true,
        message: 'Login bem-sucedido!',
        usuario: usuarioSemSenha,
        redirect: '/paginas/home.html',
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ message: 'Erro interno no servidor' });
    } finally {
      await client.close();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: 'Método não permitido' });
  }
}
