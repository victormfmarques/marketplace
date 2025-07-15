import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  // Habilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responde à pré-verificação CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');

    const { mensagem, email } = req.body;

    if (!mensagem || mensagem.length < 5) {
      return res.status(400).json({ error: 'Mensagem muito curta' });
    }

    const feedback = {
      mensagem,
      email: email || null,
      data: new Date(),
    };

    // Salva no banco
    await db.collection('feedbacks').insertOne(feedback);

    // Monta o e-mail de notificação
    const mailOptions = {
      from: `"EcoMarket Feedback" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER,
      subject: 'Novo Feedback Recebido',
      text: `Você recebeu um novo feedback:\n\nMensagem: ${mensagem}\nEmail do usuário: ${email || 'Não informado'}`,
      html: `<p>Você recebeu um novo feedback:</p>
             <p><strong>Mensagem:</strong> ${mensagem}</p>
             <p><strong>Email do usuário:</strong> ${email || 'Não informado'}</p>`,
    };

    // Envia o e-mail
    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Feedback registrado e e-mail enviado!' });
  } catch (error) {
    console.error('Erro ao registrar feedback:', error);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    await client.close();
  }
}