import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';


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

  // ✅ validação REAL de formato
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Email inválido' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');

    const usuarioExistente = await db.collection('usuarios').findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criptografa a senha
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    // 🔐 token de confirmação
    const emailToken = crypto.randomBytes(20).toString('hex');

    const novoUsuario = {
      nome,
      email,
      senha: senhaCriptografada,
      telefone: telefone || '',
      cargo: 'comprador',

      // 🆕 campos novos
      emailVerificado: false,
      emailToken,
      emailTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),

      dataCadastro: new Date()
    };

    const result = await db.collection('usuarios').insertOne(novoUsuario);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const confirmUrl = `https://associarte-marketplace.vercel.app/api?rota=perfil/confirmar-email&token=${emailToken}`;

    await transporter.sendMail({
      to: email,
      from: 'ASSOCIARTE Marketplace <contato.ecomarketsamavi@gmail.com>',
      subject: 'Confirme seu e-mail - ASSOCIARTE Marketplace',

      text: `
Olá ${nome},

Obrigado por se cadastrar na ASSOCIARTE Marketplace!

Para confirmar seu e-mail, acesse o link abaixo:
${confirmUrl}

Se você não realizou esse cadastro, ignore este email.

Equipe ASSOCIARTE
  `,

      html: `
  <div style="font-family: Arial, sans-serif; background:#FFF9F6; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:24px;">

      <div style="text-align:center; margin-bottom:20px;">
        <img src="https://associarte-marketplace.vercel.app/assets/img/logo.png"
             alt="ASSOCIARTE"
             style="max-width:160px;">
      </div>

      <h2 style="color:#D96C8F;">Confirme seu e-mail</h2>

      <p>Olá <strong>${nome}</strong>,</p>

      <p>
        Obrigado por se cadastrar na <strong>ASSOCIARTE Marketplace</strong>.
        Para ativar sua conta, confirme seu endereço de e-mail clicando no botão abaixo:
      </p>

      <div style="text-align:center; margin:30px 0;">
        <a href="${confirmUrl}"
           style="background:#D96C8F; color:#ffffff; padding:14px 28px;
                  text-decoration:none; border-radius:6px; font-weight:bold;">
          Confirmar e-mail
        </a>
      </div>

      <p style="font-size:14px; color:#666;">
        Se você não solicitou este cadastro, ignore este e-mail.
      </p>

      <hr style="margin:30px 0;">

      <p style="font-size:12px; color:#999; text-align:center;">
        © ${new Date().getFullYear()} ASSOCIARTE Marketplace
      </p>

    </div>
  </div>
  `,
    });

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso!',
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
    return res.status(500).json({ message: 'Erro no servidor' });
  } finally {
    await client.close();
  }
}