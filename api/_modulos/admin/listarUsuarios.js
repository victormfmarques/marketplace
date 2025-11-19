// api/_modulos/admin/listarUsuarios.js
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
    const { adminId } = req.query; // Pegamos o ID de quem está pedindo

    if (!adminId) {
        return res.status(401).json({ message: 'Acesso não autorizado: ID de administrador não fornecido.' });
    }

    try {
        await client.connect();
        const db = client.db('marketplace');
        const admin = await db.collection('usuarios').findOne({ _id: new ObjectId(adminId) });

        // VERIFICAÇÃO DE SEGURANÇA
        if (!admin || admin.cargo !== 'administrador') {
            return res.status(403).json({ message: 'Acesso proibido: Você não tem permissão para executar esta ação.' });
        }

        // Se a verificação passar, busca todos os usuários
        const usuarios = await db.collection('usuarios').find(
            {}, // Filtro vazio para pegar todos
            { projection: { senha: 0 } } // Projeção para NUNCA retornar a senha
        ).toArray();

        res.status(200).json({ success: true, data: usuarios });

    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    } finally {
        await client.close();
    }
}