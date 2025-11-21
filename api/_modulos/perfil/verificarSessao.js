// EM: api/_modulos/perfil/verificarSessao.js
import { MongoClient, ObjectId } from 'mongodb';
const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('marketplace');

        const usuario = await db.collection('usuarios').findOne(
            { _id: new ObjectId(userId) },
            {
                // Retorna apenas os dados essenciais da sessão
                projection: {
                    nome: 1,
                    email: 1,
                    telefone: 1,
                    sexo: 1,
                    dataNascimento: 1,
                    cargo: 1,
                    fotoPerfil: 1,
                    sobre: 1
                }
            }
        );

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json({ success: true, usuario });

    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    } finally {
        await client.close();
    }
}