import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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
        <p>Este e-mail já foi confirmado.</p>
        <a href="/paginas/login.html">Ir para login</a>
      `);
        }

        // 🔑 GERA NOVO TOKEN
        const emailToken = crypto.randomBytes(32).toString('hex');
        const emailTokenExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

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

        // 📧 CONFIGURA TRANSPORTER
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 📤 ENVIA EMAIL
        await transporter.sendMail({
            from: `"EcoMarket" <${process.env.EMAIL_USER}>`,
            to: usuario.email,
            subject: 'Confirme seu e-mail',
            html: `
        <h2>Confirmação de e-mail</h2>
        <p>Olá <strong>${usuario.nome}</strong>,</p>
        <p>Seu link de confirmação expirou. Clique abaixo para confirmar seu e-mail:</p>
        <p>
          <a href="${link}" style="
            display:inline-block;
            padding:12px 20px;
            background:#D96C8F;
            color:#fff;
            text-decoration:none;
            border-radius:6px;
          ">
            Confirmar e-mail
          </a>
        </p>
        <p>Este link expira em 1 hora.</p>
      `
        });

        return res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>E-mail reenviado</title>
<style>
  body {
    margin: 0;
    font-family: 'Poppins', Arial, sans-serif;
    background: linear-gradient(135deg, #f0fdf7, #e6f7f0);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }

  .card {
    background: #fff;
    max-width: 420px;
    width: 90%;
    padding: 32px;
    border-radius: 16px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.12);
    text-align: center;
  }

  .icon {
    font-size: 52px;
    margin-bottom: 12px;
  }

  h2 {
    color: #2e8b57;
    margin-bottom: 8px;
  }

  p {
    color: #555;
    line-height: 1.5;
    margin-bottom: 16px;
  }

  a {
    display: inline-block;
    margin-top: 12px;
    padding: 12px 20px;
    background: #D96C8F;
    color: #fff;
    border-radius: 10px;
    text-decoration: none;
    transition: 0.3s;
  }

  a:hover {
    background: #c25779;
  }

  .footer {
    margin-top: 16px;
    font-size: 13px;
    color: #888;
  }
</style>
</head>
<body>

  <div class="card">
    <div class="icon">📧</div>
    <h2>E-mail reenviado!</h2>
    <p>
      Um novo link de confirmação foi enviado para seu e-mail.<br>
      Verifique também a caixa de spam.
    </p>

    <a href="/paginas/login.html">
      Voltar para login
    </a>

    <div class="footer">
      EcoMarket • Confirmação segura
    </div>
  </div>

</body>
</html>
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