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
      subject: 'Redefinição de senha - ASSOCIARTE Marketplace',
      text: `Olá,

    Você recebeu este email porque alguém solicitou a redefinição de senha para sua conta no ASSOCIARTE Marketplace.

    Para redefinir sua senha, clique no link abaixo:
    http://associarte-marketplace.vercel.app/paginas/login.html?token=${token}

    Se o link acima não funcionar, copie e cole o token abaixo no campo indicado na página de redefinição de senha:
    Token: ${token}

    Se você não solicitou essa redefinição, simplesmente ignore este email.

    Obrigado,
    Equipe ASSOCIARTE Marketplace`,
      html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Redefinição de Senha</title>
      </head>
      <body style="margin:0; padding:0; background-color:#FFF9F6; font-family: Arial, Helvetica, sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
          <tr>
            <td align="center">

              <!-- CARD -->
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#FFFFFF; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

                <!-- HEADER -->
                <tr>
                  <td align="center" style="background:#E23E8D; padding:20px;">
                    <img 
                      src="https://associarte-marketplace.vercel.app/assets/img/logo.png"
                      alt="ASSOCIARTE"
                      style="max-width:180px; display:block;"
                    />
                  </td>
                </tr>

                <!-- CONTEÚDO -->
                <tr>
                  <td style="padding:30px; color:#4A4A4A;">

                    <h2 style="margin-top:0; color:#E23E8D;">
                      Redefinição de senha
                    </h2>

                    <p>
                      Recebemos uma solicitação para redefinir a senha da sua conta no
                      <strong>Marketplace da ASSOCIARTE</strong>.
                    </p>

                    <p>
                      Para continuar, clique no botão abaixo:
                    </p>

                    <!-- BOTÃO -->
                    <p style="text-align:center; margin:30px 0;">
                      <a 
                        href="http://associarte-marketplace.vercel.app/paginas/login.html?token=${token}"
                        style="
                          background:#E23E8D;
                          color:#FFFFFF;
                          padding:14px 28px;
                          border-radius:6px;
                          text-decoration:none;
                          font-weight:bold;
                          display:inline-block;
                        "
                      >
                        Redefinir senha
                      </a>
                    </p>

                    <p style="font-size:14px; color:#7A7A7A;">
                      Se o botão não funcionar, copie e cole o token abaixo na página de redefinição:
                    </p>

                    <!-- TOKEN -->
                    <div style="
                      background:#F5F5F5;
                      padding:12px;
                      border-radius:6px;
                      font-family: monospace;
                      word-break: break-all;
                      font-size:14px;
                    ">
                      ${token}
                    </div>

                    <p style="margin-top:20px; font-size:14px;">
                      ⚠️ Este link é válido por <strong>1 hora</strong>.
                    </p>

                    <p style="font-size:14px; color:#7A7A7A;">
                      Caso você não tenha solicitado essa redefinição, ignore este e-mail.
                    </p>

                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td align="center" style="background:#FFF0F6; padding:15px; font-size:12px; color:#7A7A7A;">
                    © ${new Date().getFullYear()} ASSOCIARTE – Associação dos Artesãos e Artistas<br>
                    Santa Maria da Vitória – BA
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
      </html>
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