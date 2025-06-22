import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { nome, email, senha, sexo, dataNascimento, telefone } = req.body;

    try {
      await client.connect();
      const db = client.db('marketplace');

      // Verifica se email já existe
      const usuarioExistente = await db.collection('usuarios').findOne({ email });
      if (usuarioExistente) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      // Criptografa a senha
      const senhaCriptografada = await bcrypt.hash(senha, 10);

      // Insere com TODOS os campos
      const result = await db.collection('usuarios').insertOne({
        nome,
        email,
        senha: senhaCriptografada,
        sexo,
        dataNascimento: new Date(dataNascimento), // Converte para Date
        telefone,
        dataCadastro: new Date()
      });

      res.status(201).json({ 
        message: 'Usuário registrado com sucesso!',
        usuario: {
          _id: result.insertedId,
          nome,
          email,
          sexo,
          dataNascimento,
          telefone
        },
        redirect: '/paginas/home.html'
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