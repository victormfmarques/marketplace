import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    const { adminId, targetUserId, novoCargo } = req.body;

    // Validação básica
    if (!adminId || !targetUserId || !novoCargo) {
        return res.status(400).json({ message: 'Dados incompletos.' });
    }
    if (novoCargo !== 'vendedor' && novoCargo !== 'comprador') {
        return res.status(400).json({ message: 'Cargo inválido.' });
    }

    try {
        await client.connect();
        const db = client.db('marketplace');
        
        // 1. VERIFICAÇÃO DE SEGURANÇA: O requisitante é um admin?
        const admin = await db.collection('usuarios').findOne({ _id: new ObjectId(adminId) });
        if (!admin || admin.cargo !== 'administrador') {
            return res.status(403).json({ message: 'Acesso proibido.' });
        }

        // 2. EXECUTA A AÇÃO: Atualiza o cargo do usuário alvo
        const result = await db.collection('usuarios').updateOne(
            { _id: new ObjectId(targetUserId) },
            { $set: { cargo: novoCargo } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Usuário alvo não encontrado ou já possui este cargo.' });
        }

        res.status(200).json({ success: true, message: 'Cargo do usuário atualizado com sucesso!' });

    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    } finally {
        await client.close();
    }
}