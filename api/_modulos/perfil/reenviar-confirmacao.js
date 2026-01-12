import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).send(`
      <h2>Erro</h2>
      <p>E-mail não informado.</p>
    `);
  }

  try {
    await client.connect();
    const db = client.db('marketplace');

    const usuario = await db.collection('usuarios').findOne({ email });

    if (!usuario) {
      return res.status(404).send(`
        <h2>Usuário não encontrado</h2>
        <p>Não foi possível localizar este e-mail.</p>
      `);
    }

    if (usuario.emailVerificado) {
      return res.status(400).send(`
        <h2>E-mail já confirmado</h2>
        <p>Este e-mail já foi confirmado. Você pode fazer login.</p>
        <a href="/paginas/login.html">Ir para login</a>
      `);
    }

    // 🔑 GERA NOVO TOKEN
    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h

    await db.collection('usuarios').updateOne(
      { _id: usuario._id },
      {
        $set: {
          emailToken,
          emailTokenExpires
        }
      }
    );

    // 🔗 LINK DE CONFIRMAÇÃO
    const link = `${process.env.BASE_URL}/api?rota=auth/confirmar-email&token=${emailToken}`;

    // 📧 ENVIO DO EMAIL (usa seu endpoint já existente)
    await fetch(`${process.env.BASE_URL}/api?rota=email/enviar-confirmacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        nome: usuario.nome,
        link
      })
    });

    return res.send(`
      <h2>E-mail reenviado com sucesso ✅</h2>
      <p>Enviamos um novo link de confirmação para o seu e-mail.</p>
      <p>Verifique também a caixa de spam.</p>
      <a href="/paginas/login.html">Voltar para login</a>
    `);

  } catch (error) {
    console.error('Erro ao reenviar confirmação:', error);
    return res.status(500).send(`
      <h2>Erro interno</h2>
      <p>Não foi possível reenviar o e-mail de confirmação.</p>
    `);
  } finally {
    await client.close();
  }
}