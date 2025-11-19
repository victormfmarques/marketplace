import { MongoClient, ObjectId } from 'mongodb';
const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

    const { adminId, targetUserId, novosDados } = req.body;
    if (!adminId || !targetUserId) return res.status(400).json({ message: 'Dados incompletos.' });

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('marketplace');
        const admin = await db.collection('usuarios').findOne({ _id: new ObjectId(adminId) });
        if (!admin || admin.cargo !== 'administrador') {
            return res.status(403).json({ message: 'Acesso proibido.' });
        }

        const result = await db.collection('usuarios').updateOne(
            { _id: new ObjectId(targetUserId) },
            { $set: { nome: novosDados.nome, email: novosDados.email } } // Atualiza os campos
        );
        
        res.status(200).json({ success: true, message: 'Usuário atualizado!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    } finally {
        await client.close();
    }
}