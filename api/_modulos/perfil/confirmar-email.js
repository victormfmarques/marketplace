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
    <h2>Link expirado</h2>
    <p>O link de confirmação expirou.</p>

    <form method="POST" action="/api?rota=auth/reenviar-confirmacao">
      <input type="hidden" name="email" value="${usuario.email}">
      <button type="submit">
        Reenviar e-mail de confirmação
      </button>
    </form>
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