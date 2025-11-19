import { MongoClient, ObjectId } from 'mongodb';
const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

    const { adminId, targetUserId } = req.body;
    if (!adminId || !targetUserId) return res.status(400).json({ message: 'Dados incompletos.' });

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('marketplace');
        
        const admin = await db.collection('usuarios').findOne({ _id: new ObjectId(adminId) });
        if (!admin || admin.cargo !== 'administrador') {
            return res.status(403).json({ message: 'Acesso proibido.' });
        }

        const result = await db.collection('usuarios').deleteOne({ _id: new ObjectId(targetUserId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Usuário alvo não encontrado.' });
        }

        res.status(200).json({ success: true, message: 'Usuário excluído com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    } finally {
        await client.close();
    }
}