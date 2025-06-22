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

      // Debug: Mostrar informações importantes
      console.log('Senha digitada:', senha);
      console.log('Hash armazenado:', usuario.senha);

      // Verificação correta do hash
      const senhaValida = await bcrypt.compare(senha, usuario.senha);

      console.log('Resultado da comparação:', senhaValida);

      if (!senhaValida) {
        return res.status(401).json({ 
          message: 'Credenciais inválidas',
          suggestion: 'Verifique sua senha'
        });
      }

      const { senha: _, ...usuarioSemSenha } = usuario;
      
      res.status(200).json({ 
        success: true,
        message: 'Login bem-sucedido!',
        usuario: usuarioSemSenha,
        redirect: '/paginas/home.html'
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