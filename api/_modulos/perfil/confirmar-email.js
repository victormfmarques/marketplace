import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).send('Método não permitido');
    }

    const { token } = req.query;

    if (!token) {
        return res.status(400).send(`
      <h2>Link inválido</h2>
      <p>O link de confirmação é inválido ou incompleto.</p>
    `);
    }

    try {
        await client.connect();
        const db = client.db('marketplace');

        const usuario = await db.collection('usuarios').findOne({
            emailToken: token
        });

        if (!usuario) {
            return res.status(400).send(`
        <h2>Link inválido</h2>
        <p>Este link não é válido ou já foi utilizado.</p>
      `);
        }

        // ⏰ TOKEN EXPIRADO
        if (
            usuario.emailTokenExpires &&
            usuario.emailTokenExpires < new Date()
        ) {
            return res.status(410).send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Link expirado</title>
<style>
  body {
    margin: 0;
    font-family: 'Poppins', Arial, sans-serif;
    background: linear-gradient(135deg, #f8d7e6, #fdeef5);
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
    color: #D96C8F;
    margin-bottom: 8px;
  }

  p {
    color: #555;
    line-height: 1.5;
    margin-bottom: 20px;
  }

  button {
    width: 100%;
    padding: 14px;
    background: #D96C8F;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    transition: 0.3s;
  }

  button:hover {
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
    <div class="icon">⏰</div>
    <h2>Link expirado</h2>
    <p>
      O link de confirmação do seu e-mail expirou.<br>
      Não se preocupe, podemos reenviar um novo.
    </p>

    <form method="POST" action="/api?rota=perfil/reenviar-confirmacao">
      <input type="hidden" name="email" value="${usuario.email}">
      <button type="submit">
        Reenviar e-mail de confirmação
      </button>
    </form>

    <div class="footer">
      EcoMarket • Segurança e confiança
    </div>
  </div>

</body>
</html>
`);
        }


        // ✅ CONFIRMA EMAIL
        await db.collection('usuarios').updateOne(
            { _id: usuario._id },
            {
                $set: { emailVerificado: true },
                $unset: {
                    emailToken: '',
                    emailTokenExpires: ''
                }
            }
        );

        return res.redirect('/paginas/login.html?emailConfirmado=1');

    } catch (error) {
        console.error('Erro ao confirmar email:', error);
        return res.status(500).send(`
      <h2>Erro interno</h2>
      <p>Ocorreu um erro ao confirmar seu e-mail.</p>
    `);
    } finally {
        await client.close();
    }
}