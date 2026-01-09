import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { email } = req.body;

  try {
    await client.connect();
    const db = client.db('marketplace');

    const user = await db.collection('usuarios').findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email não cadastrado' });
    }

    // Gera token e define validade de 1h
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    // Atualiza o usuário com token e validade
    await db.collection('usuarios').updateOne(
      { email },
      { $set: { resetPasswordToken: token, resetPasswordExpires: expires } }
    );

    // Configura o envio de email (exemplo com Gmail SMTP)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,        // coloque no .env
        pass: process.env.EMAIL_PASS,    // senha app do Gmail, ou outro SMTP
      },
    });

    const mailOptions = {
    to: email,
    from: 'contato.ecomarketsamavi@gmail.com',
    subject: 'Redefinição de senha - EcoMarket Samavi',
    text: `Olá,

    Você recebeu este email porque alguém solicitou a redefinição de senha para sua conta no EcoMarket Samavi.

    Para redefinir sua senha, clique no link abaixo:
    http://ecomarket-samavi.vercel.app/paginas/login.html?token=${token}

    Se o link acima não funcionar, copie e cole o token abaixo no campo indicado na página de redefinição de senha:
    Token: ${token}

    Se você não solicitou essa redefinição, simplesmente ignore este email.

    Obrigado,
    Equipe EcoMarket Samavi`,
      html: `
        <p>Olá,</p>
        <p>Você recebeu este email porque alguém solicitou a redefinição de senha para sua conta no EcoMarket Samavi.</p>
        <p><a href="http://ecomarket-samavi.vercel.app?token=${token}">Clique aqui para redefinir sua senha</a></p>
        <p>Se o link acima não funcionar, copie e cole o token abaixo no campo indicado na página de redefinição de senha:</p>
        <p><strong>Token:</strong> ${token}</p>
        <p>Se você não solicitou essa redefinição, simplesmente ignore este email.</p>
        <p>Obrigado,<br>Equipe EcoMarket Samavi</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'E-mail com instruções enviado.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error: error.message });
  } finally {
    await client.close();
  }
}