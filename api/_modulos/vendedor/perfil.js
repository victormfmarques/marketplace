// api/_modulos/vendedor/perfil.js

import { MongoClient, ObjectId } from 'mongodb';
const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    const { vendedorId } = req.query;

    if (!vendedorId) {
        return res.status(400).json({ message: 'ID do vendedor é obrigatório.' });
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('marketplace');

        // 1. Busca os dados do vendedor
        const vendedor = await db.collection('usuarios').findOne(
            { _id: new ObjectId(vendedorId) },
            {
                // Projeção: define quais campos queremos pegar (para segurança e eficiência)
                projection: {
                    nome: 1,
                    email: 1, // Opcional, talvez você não queira mostrar
                    telefone: 1, // Opcional
                    fotoPerfil: 1, // Vamos assumir que você adicionará este campo no futuro
                    sobre: 1, // E este também
                    cargo: 1
                }
            }
        );

        if (!vendedor || (vendedor.cargo !== 'vendedor' && vendedor.cargo !== 'administrador')) {
            return res.status(404).json({ message: 'Vendedor não encontrado.' });
        }

        // 2. Busca todos os produtos deste vendedor
        const produtos = await db.collection('produtos').find({ usuarioId: new ObjectId(vendedorId) }).toArray();

        // 3. Combina tudo em uma única resposta
        res.status(200).json({
            success: true,
            vendedor: vendedor,
            produtos: produtos
        });

    } catch (error) {
        console.error('Erro ao buscar perfil do vendedor:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    } finally {
        await client.close();
    }
}
